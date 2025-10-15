// Import logo image
import logoPath from '../images/decidim/admin_header/ldt-logo.png';

document.addEventListener('DOMContentLoaded', () => {
	const container = document.getElementById('ldt-logo');
	if (container) {
		const img = document.createElement('img');
		img.src = logoPath;
		img.alt = 'LDT Logo';
		img.classList.add('ldt-logo');
		container.appendChild(img);
	}
});
