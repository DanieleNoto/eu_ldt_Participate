/**
 * Base class for models that require DTO conversion.
 */
export abstract class BaseModel<DTO = unknown> {
	_dto!: DTO;

	/**
	 * Converts a DTO into a model instance.
	 * Must be implemented in the derived class.
	 * @param dto - The data transfer object.
	 * @returns An instance of the model.
	 */
	public static fromDto(dto: never): BaseModel {
		// eslint-disable-next-line no-console
		console.error('fromDto method must be implemented in the derived class: ', dto);
		throw new Error('fromDto method must be implemented in the derived class');
	}
}
