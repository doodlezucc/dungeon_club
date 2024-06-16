import 'dart:convert';
import 'dart:io';

import 'package:crypt/crypt.dart';
import 'package:dungeonclub/iterable_extension.dart';
import 'package:random_string/random_string.dart';

import 'data.dart';
import 'recovery_handler.dart';
import 'restore_orphan_campaigns.dart';
import 'server.dart';

void main(List<String> args) async {
  final operationJson = await analysisFile.readAsString();
  final memoryGap = MemoryGapOperation.fromJson(jsonDecode(operationJson));

  final recreatedAccountHashes = Map<String, String>.from(jsonDecode(
    await File('../TMP_CONFIDENTIAL/recreated-account-hashes.json')
        .readAsString(),
  ));

  final server = Server();
  final serverData = server.data;
  await serverData.init();

  final restorer = Restorer(memoryGap, recreatedAccountHashes, serverData);
  final result = await restorer.run();

  await File('../TMP_CONFIDENTIAL/restorer-effects.json')
      .writeAsString(jsonEncode(result.toJson()));

  await File('database/unrecovered-emails-UNCHECKED.json').writeAsString(
      jsonEncode(result.lostEmailsWithRestoredGames.keys.toList()));

  await serverData.save();
  exit(0);
}

class Restorer {
  final MemoryGapOperation memoryGap;
  final Map<String, String> recreatedAccountCrypts;
  final ServerData serverData;

  late RestorerResult _result;
  late final _placeholderAccount = PlaceholderAccount(serverData);
  bool _isPlaceholderAccountAdded = false;

  final Map<String, Account> _registeredAccountsWithRandomPassword = {};

  Restorer(this.memoryGap, this.recreatedAccountCrypts, this.serverData);

  Future<RestorerResult> run() async {
    _result = RestorerResult();
    await unlinkDeletedOldGames();
    await applyRenamesToExistentGames();

    await createLostGameMetas();
    return _result;
  }

  Future<void> unlinkDeletedOldGames() async {
    for (var gameID in memoryGap.deletedGameIDs) {
      final game = serverData.gameMeta.find((e) => e.id == gameID);
      if (game != null) {
        _result.push(game.owner,
            StaleGameUnlinkEffect(gameID: game.id, gameName: game.name));

        print('Deleting $gameID');
        await game.delete();
      } else {
        print('Unable to delete $gameID');
      }
    }
  }

  Future<void> applyRenamesToExistentGames() async {
    for (var entry in memoryGap.oldGameRenames.entries) {
      final gameID = entry.key;
      final newName = entry.value;

      if (newName == null) continue;

      final game = serverData.gameMeta.find((e) => e.id == gameID);
      if (game != null) {
        print('Renaming $gameID from "${game.name}" to "$newName"');
        _result.push(
          game.owner,
          GameRenameEffect(gameID: gameID, gameName: newName),
        );
        game.name = newName;
      } else {
        print('Unable to rename $gameID');
      }
    }
  }

  Account? _findAccountFromHash(String emailHash) {
    return serverData.accounts
        .find((account) => account.encryptedEmail.hash == emailHash);
  }

  Account? _findRecreatedHashOfEmail(String email) {
    final encrypted = recreatedAccountCrypts[email];

    if (encrypted != null) {
      return _findAccountFromHash(Crypt(encrypted).hash);
    } else {
      return null;
    }
  }

  Account _registerAccountWithRandomPassword(String email) {
    final password = randomString(16);
    final newAccount = Account(serverData, email, password);

    serverData.accounts.add(newAccount);
    return newAccount;
  }

  Account _findAccountWithRandomPWForEmail(String email) {
    return _registeredAccountsWithRandomPassword.putIfAbsent(
      email,
      () => _registerAccountWithRandomPassword(email),
    );
  }

  Future<void> createLostGameMetas() async {
    for (var entry in memoryGap.createdGameIDNames.entries) {
      final gameID = entry.key;
      final gameName = entry.value;

      if (gameName != null) {
        print('Creating orphan campaign $gameID with name "$gameName"');

        final ownerHashOrEmail = memoryGap.singleSuspectOwners[gameID];
        Account owner;

        if (ownerHashOrEmail != null) {
          final accountInDatabase = ownerHashOrEmail.contains('@')
              ? _findRecreatedHashOfEmail(ownerHashOrEmail)
              : _findAccountFromHash(ownerHashOrEmail);

          final gameRestoredEffect = GameRestoredEffect(
            gameID: gameID,
            gameName: gameName,
          );

          if (accountInDatabase != null) {
            owner = accountInDatabase;
            print('Relinking game with existing account');

            _result.push(owner, gameRestoredEffect);
          } else {
            owner = _findAccountWithRandomPWForEmail(ownerHashOrEmail);
            print('Game belongs to account which has been lost'
                ' (user must recreate their account)');

            _result.pushLimboGame(ownerHashOrEmail, gameRestoredEffect);
          }
        } else {
          owner = _placeholderAccount;
          if (!_isPlaceholderAccountAdded) {
            _isPlaceholderAccountAdded = true;
            serverData.accounts.add(_placeholderAccount);
          }
        }

        final meta = OrphanGameMeta(serverData, owner, gameID);
        final baseGameName = gameName.trim().isEmpty ? 'Untitled' : gameName;
        meta.name = '$baseGameName (restored)';

        owner.enteredGames.add(meta);
        serverData.gameMeta.add(meta);
      } else {
        print('Unable to create orphan campaign $gameID (no name given)');
      }
    }
  }
}

mixin RestorerEffect {
  Map<String, dynamic> toJson() => {
        'type': runtimeType.toString(),
      };

  static final _restorerEffectConstructors = {
    StaleGameUnlinkEffect: StaleGameUnlinkEffect.fromJson,
    GameRenameEffect: StaleGameUnlinkEffect.fromJson,
    GameRestoredEffect: GameRestoredEffect.fromJson,
  }.map((type, ctor) => MapEntry(type.toString(), ctor));

  static RestorerEffect parse(dynamic json) {
    final type = json['type'];

    final constructFromJson = _restorerEffectConstructors[type]!;
    return constructFromJson(json);
  }

  String get summary;
}

abstract class GameEffect with RestorerEffect {
  final String gameID;
  final String gameName;

  GameEffect({required this.gameID, required this.gameName});
  GameEffect.fromJson(json)
      : gameID = json['gameID'],
        gameName = json['gameName'];

  @override
  Map<String, dynamic> toJson() => {
        ...super.toJson(),
        'gameID': gameID,
        'gameName': gameName,
      };
}

class StaleGameUnlinkEffect extends GameEffect {
  StaleGameUnlinkEffect({required super.gameID, required super.gameName});
  StaleGameUnlinkEffect.fromJson(json) : super.fromJson(json);

  @override
  String get summary =>
      'The stale, deleted campaign "$gameName" will no longer show up.';
}

class GameRenameEffect extends GameEffect {
  GameRenameEffect({required super.gameID, required super.gameName});
  GameRenameEffect.fromJson(json) : super.fromJson(json);

  @override
  String get summary => '''A campaign's name was updated to "$gameName".''';
}

class GameRestoredEffect extends GameEffect {
  GameRestoredEffect({required super.gameID, required super.gameName});
  GameRestoredEffect.fromJson(json) : super.fromJson(json);

  @override
  String get summary =>
      'The vanished campaign "$gameName" has been restored and is back on your account.';
}

class RestorerResult {
  final Map<Account, List<RestorerEffect>> affectedAccounts = {};
  final Map<String, List<GameRestoredEffect>> lostEmailsWithRestoredGames = {};

  void push(Account acc, RestorerEffect effect) {
    final effects = affectedAccounts.putIfAbsent(acc, () => []);
    effects.add(effect);
  }

  void pushLimboGame(String ownerEmail, GameRestoredEffect effect) {
    final games = lostEmailsWithRestoredGames.putIfAbsent(ownerEmail, () => []);
    games.add(effect);
  }

  Map<String, dynamic> toJson() => {
        'affectedAccounts': affectedAccounts.map(
            (key, value) => MapEntry(key.encryptedEmail.toString(), value)),
        'lostEmailsWithRestoredGames': lostEmailsWithRestoredGames,
      };
}

class PlainRestorerResult {
  final Map<Crypt, List<RestorerEffect>> affectedAccounts;
  final Map<String, List<GameRestoredEffect>> lostEmailsWithRestoredGames;

  PlainRestorerResult.fromJson(Map<String, dynamic> json)
      : affectedAccounts = Map.from(json['affectedAccounts']).map(
          (accountCrypt, effectJsons) => MapEntry(
            Crypt(accountCrypt),
            (effectJsons as Iterable).map(RestorerEffect.parse).toList(),
          ),
        ),
        lostEmailsWithRestoredGames =
            Map.from(json['lostEmailsWithRestoredGames']).map(
          (key, effectJsons) => MapEntry(
            key,
            (effectJsons as Iterable).map(GameRestoredEffect.fromJson).toList(),
          ),
        );
}

class OrphanGameMeta extends GameMeta {
  final String _id;

  @override
  String get id => _id;

  OrphanGameMeta(super.data, super.owner, this._id) : super.create();
}
