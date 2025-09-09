
import styles from './Logo.module.css';

export default function Logo() {
  return (
    <img
      src="/logo.svg"
      alt="Logo"
      className={`${styles.logo} ${styles.spin}`}
    />
  );
}
