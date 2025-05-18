import { Link } from 'react-router-dom';
import '../../../styles/Footer.css';
function Footer() {
    return (
    <footer>
        © 2025 Travel Guide | All rights reserved
        <span> | </span>
        <Link to="/about">About</Link>
    </footer>
    );
}

export default Footer;
