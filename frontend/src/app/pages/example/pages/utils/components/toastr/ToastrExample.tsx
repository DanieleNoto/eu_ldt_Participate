import { useTranslation } from 'react-i18next';

const ToastrExample = () => {
	// const { info, success, warning, error } = useToastr();

	// const showInfo = () => {
	//     info({
	//         title: 'Info',
	//         text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc sit amet augue sed felis euismod lacinia vel et risus. Interdum et malesuada fames ac ante ipsum primis in faucibus. ',
	//         options: { showClose: true }
	//     });
	// };
	// const showSuccess = () => {
	//     success({
	//         title: 'Success',
	//         text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc sit amet augue sed felis euismod lacinia vel et risus. Interdum et malesuada fames ac ante ipsum primis in faucibus. '
	//     });
	// };
	// const showWarning = () => {
	//     warning({
	//         title: 'Warning',
	//         text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc sit amet augue sed felis euismod lacinia vel et risus. Interdum et malesuada fames ac ante ipsum primis in faucibus. '
	//     });
	// };
	// const showError = () => {
	//     error({
	//         title: 'Error',
	//         text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc sit amet augue sed felis euismod lacinia vel et risus. Interdum et malesuada fames ac ante ipsum primis in faucibus. '
	//     });
	// };

	const { t } = useTranslation();

	return (
		<>
			<h3>{t('example.utils.toastr.title')}</h3>
		</>
	);
};

export default ToastrExample;
