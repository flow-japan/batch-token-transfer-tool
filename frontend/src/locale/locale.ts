import { useRouter } from 'next/router';

import en from './en'
import zh from './zh'
import ja from './ja'
import { Lang } from 'types/locale';

export const getLocale = (lang: Lang) => {
    switch (lang) {
        case 'en':
            return en
        case 'zh':
            return zh
        case 'ja':
            return ja
        default:
            return en
    }
}