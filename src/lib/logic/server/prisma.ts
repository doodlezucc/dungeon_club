import { Prisma, PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient().$extends({
	model: {
		$allModels: {
			async updateArrayOrder<T, E>(
				this: T,
				{ updateTo: nextArray, where, arrayName }: UpdateOrderOptions<T, E>
			) {
				// Arbitrary type cast to "prisma.asset", ONLY here for IntelliSense
				const context = Prisma.getExtensionContext(this) as unknown as Prisma.AssetDelegate;

				const result = (await context.findUniqueOrThrow({
					where,
					select: {
						[arrayName]: true
					}
				})) as unknown as Record<string, E[]>;

				const previousArray = result[arrayName as string];
				const previousValueSet = new Set(previousArray);
				const nextValueSet = new Set(nextArray);

				if (previousValueSet.size !== nextValueSet.size) {
					throw 'Array count must not be manipulated by reorder';
				}

				for (const nextValue of nextValueSet) {
					if (!previousValueSet.has(nextValue)) {
						throw 'Array items must not be manipulated by reorder';
					}
				}

				await context.update({
					where,
					data: {
						[arrayName]: nextArray
					}
				});
			}
		}
	}
});

interface UpdateOrderOptions<T, E> {
	updateTo: E[];
	where: Prisma.Args<T, 'findUnique'>['where'];
	arrayName: keyof Prisma.Payload<T>['scalars'];
}
