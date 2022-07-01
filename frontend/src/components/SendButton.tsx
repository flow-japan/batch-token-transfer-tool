import { Badge, Button, HStack, Link, Spinner, VStack } from '@chakra-ui/react';
import {
  CheckCircleIcon,
  ExternalLinkIcon,
  WarningTwoIcon,
} from '@chakra-ui/icons';

type SendButtonProp = {
  status: number;
  txid?: string;

  isLoading: boolean;
  disabled: boolean;
  checkDone: boolean;
  symbol: string;
  explorerUrl: string;
};

const SendButton = (prop: SendButtonProp) => {
  const { status, txid, isLoading, disabled, checkDone, symbol, explorerUrl } =
    prop;

  const { text, color } = toStatusBadge(status);

  return (
    <VStack p={4}>
      <Button
        mt={4}
        colorScheme='blue'
        size='lg'
        type='submit'
        isLoading={isLoading}
        disabled={disabled}
      >
        {checkDone ? `Send ${symbol}` : 'Check'}
      </Button>
      {txid && (
        <HStack>
          {status < 4 ? (
            <Spinner size='xs' />
          ) : status == 4 ? (
            <CheckCircleIcon color='green.300' w={5} h={5} />
          ) : (
            <WarningTwoIcon color='red.300' w={5} h={5} />
          )}
          <Badge colorScheme={color}>{text}</Badge>
          <Link href={explorerUrl + txid} isExternal>
            0x{txid.substring(0, 12)}... <ExternalLinkIcon mx='2px' />
          </Link>
        </HStack>
      )}
    </VStack>
  );
};

const toStatusBadge = (status: number): { text: string; color: string } => {
  switch (status) {
    case 0:
      return { text: 'UNKNOWN', color: 'gray' };
    case 1:
      return { text: 'PENDING', color: 'yellow' };
    case 2:
      return { text: 'EXECUTING', color: 'orange' };
    case 3:
      return { text: 'SEALING', color: 'blue' };
    case 4:
      return { text: 'SEALED', color: 'green' };
    case 5:
      return { text: 'EXPIRED', color: 'red' };
    default:
      return { text: 'UNKNOWN', color: 'gray' };
  }
};

export default SendButton;
