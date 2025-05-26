import { useTranslation } from 'react-i18next';

const Forms = () => {
	// const form: Form = {
	// 	controls: {
	// 		name: new TextInput({
	// 			label: 'Nome',
	// 			help: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam vehicula hendrerit elit id cursus',
	// 			type: 'text',
	// 			size: 'md:w-1/2 lg:w-1/3',
	// 			registerOptions: {
	// 				required: true
	// 			}
	// 		}),
	// 		surname: new TextInput({
	// 			label: 'Cognome',
	// 			type: 'text',
	// 			size: 'md:w-1/2 lg:w-1/3',
	// 			registerOptions: {
	// 				required: true
	// 			}
	// 		}),
	// 		description: new TextAreaInput({
	// 			label: 'Descrizione',
	// 			size: 'md:w-1/2 lg:w-1/3',
	// 			registerOptions: {
	// 				required: false
	// 			},
	// 			placeholder: 'Inserisci testo'
	// 		}),
	// 		cookie: new CheckBoxInput({
	// 			label: 'Consenti cookie',
	// 			size: 'md:w-1/2 lg:w-1/3',
	// 			registerOptions: {
	// 				required: false
	// 			}
	// 		}),
	// 		date: new DatePickerInput({
	// 			label: 'Seleziona mese',
	// 			minDate: subDays(new Date(), 5),
	// 			maxDate: addDays(new Date(), 5),
	// 			size: 'md:w-1/2 lg:w-1/3',
	// 			registerOptions: {
	// 				required: false
	// 			}
	// 		})
	// 	},
	// 	footer: {
	// 		showSubmit: true,
	// 		showReset: true
	// 	},
	// 	onSubmit: data => console.log(data)
	// };

	const { t } = useTranslation();

	return <h3>{t('example.forms.title')}</h3>;
};

export default Forms;
