import { useTranslation } from 'react-i18next';

const DialogExample = ()=> {
	// const [dialog, openDialog, closeDialog] = useDialog(DialogContent, {
	// 	title: 'Test',
	// 	options: { size: DialogSize.small }
	// });

	const { t } = useTranslation();

	return <h3>{t('example.utils.dialogs.title')}</h3>;
}

export default DialogExample;
