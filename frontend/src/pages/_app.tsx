import type { AppProps } from 'next/app';
import Head from 'next/head';
import { RecoilRoot } from 'recoil';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import Layout from '../components/Layout';
import '../styles/globals.css';

const theme = extendTheme({
  colors: {
    brand: {
      50: '#E5FFF4',
      500: '#00EF8A',
      800: '#00663C',
    },
  },
});

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Raindrop | Batch Token Transfer Tool</title>
        <meta
          name='description'
          content='Easily transfer Flow tokens to multiple addresses.'
        />
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />
      </Head>
      <RecoilRoot>
        <ChakraProvider theme={theme}>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </ChakraProvider>
      </RecoilRoot>
    </>
  );
}

export default MyApp;
