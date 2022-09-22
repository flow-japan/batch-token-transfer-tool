import { useRecoilState } from "recoil";
import { Lang } from "types/locale";
import { localeState } from '../store';
import styles from '../styles/LanguageButton.module.css';

const languages: Lang[] = ['en', 'zh', 'ja'];

const LanguageSwitch = () => {
  const [lang, setLang] = useRecoilState(localeState);

  const onClick = (lang: Lang) => {
    setLang(lang);
  }

  return (
    <div className={styles.lang}> 
      <div className={getStyle(lang)}></div>
      <ul className={styles.dropdown}>
        {languages.map(x => {
          if (x != lang) {
            return <li onClick={() => onClick(x)} key={x}>
            <div className={getStyle(x)}></div>
          </li>
          }
        })
        }
      </ul>
    </div>
  );
};

const getStyle = (lang: Lang) => {
  switch(lang) {
    case 'en':
      return styles.en
    case 'zh':
      return styles.zh
    case 'ja':
      return styles.ja
  }
}
  
export default LanguageSwitch;
  