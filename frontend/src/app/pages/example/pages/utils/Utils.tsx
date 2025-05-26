import DialogExample from './components/dialog/DialogExample';
import ToastrExample from './components/toastr/ToastrExample';

const Utils = () => {
	return (
		<div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
			<div>
				<DialogExample />
			</div>
			<div>
				<ToastrExample />
			</div>
		</div>
	);
};

export default Utils;
