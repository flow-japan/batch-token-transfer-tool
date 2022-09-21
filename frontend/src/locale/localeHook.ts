import { useRouter } from 'next/router';

import en from './en'
import zh from './zh'
import ja from './ja'

export const useLocale = () => {
    const { locale } = useRouter()
    switch(locale) {
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