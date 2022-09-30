import { useRecoilState } from 'recoil';
import { Lang } from 'types/locale';
import { localeState } from '../store';
import styles from '../styles/LanguageButton.module.css';

type Home = 'home'
const languages: Lang[] = ['en', 'zh', 'ja'];

const LanguageSwitch = () => {
  const [lang, setLang] = useRecoilState(localeState);

  const onClick = (lang: Lang) => {
    setLang(lang);
  };

  return (
    <div className={styles.lang}>
      <div className={getStyle('home', false)}></div>
      <ul className={styles.dropdown}>
        {languages.map((x) => {
          return (
            <li onClick={() => onClick(x)} key={x}>
              <div className={getStyle(x, x === lang)}></div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const getStyle = (lang: Lang | Home, selected: boolean) => {
  switch (lang) {
    case 'home':
      return styles.home;
    case 'en':
      return selected ? styles.en : styles.en2;
    case 'zh':
      return selected ? styles.zh : styles.zh2;
    case 'ja':
      return selected ? styles.ja : styles.ja2;
  }
};

export default LanguageSwitch;
