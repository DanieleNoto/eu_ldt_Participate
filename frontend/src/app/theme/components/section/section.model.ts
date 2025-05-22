import { SectionActionModel } from '@app/theme/components/section/sectionAction.model';

export interface SectionModel {
	sectionTitle: string | null;
	parentTitle?: string | null;
	parentLink?: string | null;
	actions?: SectionActionModel[];
}
