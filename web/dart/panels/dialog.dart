import 'dart:async';
import 'dart:html';

import 'package:pedantic/pedantic.dart';

import '../font_awesome.dart';

final HtmlElement _overlay = querySelector('#overlay');

class Dialog<T> {
  final HtmlElement _e;
  final _completer = Completer();
  InputElement _input;
  ButtonElement _okButton;

  Dialog(String title, {T Function() onClose, String okText = 'OK'})
      : _e = DivElement()..className = 'panel' {
    _e
      ..append(HeadingElement.h2()..text = title)
      ..append(iconButton('times')
        ..className = 'close'
        ..onClick.listen((event) {
          _completer.complete(onClose());
        }))
      ..append(_okButton = ButtonElement()
        ..className = 'big'
        ..text = okText
        ..onClick.listen((event) {
          _completer.complete(_input?.value ?? true);
        }));
  }

  Dialog withInput({String type = 'text', String placeholder}) {
    _input = InputElement(type: type)
      ..placeholder = placeholder
      ..onKeyDown.listen((event) {
        if (event.keyCode == 13) {
          _completer.complete(_input.value);
        }
      });
    _e.insertBefore(_input, _okButton);
    return this;
  }

  Future<T> display() async {
    _overlay.append(_e);
    _e.classes.add('show');
    (_input ?? _okButton).focus();

    var result = await _completer.future;
    _e.classes.remove('show');
    unawaited(
        Future.delayed(Duration(seconds: 1)).then((value) => _e.remove()));
    return result;
  }
}
