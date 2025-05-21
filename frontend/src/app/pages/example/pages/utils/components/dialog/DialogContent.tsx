interface Props {
	closeDialog: () => void;
}

const DialogContent = ({ closeDialog }: Props) => {
	return (
		<>
			<div className="uc:mt-2">
				<p className="uc:text-sm uc:text-gray-500">
					Your payment has been successfully submitted. We’ve sent you an email with all of the details of
					your order.
				</p>
			</div>

			<div className="uc:mt-4">
				<button
					type="button"
					className="uc:inline-flex uc:justify-center uc:px-4 uc:py-2 uc:text-sm uc:font-medium uc:text-blue-900 uc:bg-blue-100 uc:border uc:border-transparent uc:rounded-md uc:hover:bg-blue-200 uc:focus:outline-none uc:focus-visible:ring-2 uc:focus-visible:ring-offset-2 uc:focus-visible:ring-blue-500"
					onClick={() => {
						closeDialog();
					}}
				>
					Got it, thanks!
				</button>
			</div>
		</>
	);
};

export default DialogContent;
