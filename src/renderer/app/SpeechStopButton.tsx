import * as React from 'react';
import { Button } from '@mui/material';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import { getSpeechState, requestStopSpeech, subscribeSpeechState } from '../speechControl';

/** 読み上げ中かどうか (読み上げ + 表示を維持する待ちの間) */
export const useSpeechActive = () => {
  const [active, setActive] = React.useState(false);
  React.useEffect(() => {
    let mounted = true;
    void getSpeechState().then((state) => mounted && setActive(state.active));
    const unsubscribe = subscribeSpeechState((state) => setActive(state.active));
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);
  return active;
};

/**
 * 読み上げ中断ボタン (#77)。読み上げ中だけ押せる。
 * 押すと読み上げと、そのレスの表示を維持する待ちを打ち切って次のレスへ進む。
 * 置き場所を変えやすいよう、状態の取得も含めてこの部品だけで完結させている。
 */
export const SpeechStopButton: React.FC = () => {
  const active = useSpeechActive();
  return (
    <Button variant="contained" color="warning" startIcon={<VolumeOffIcon />} disabled={!active} onClick={requestStopSpeech}>
      読み上げ中断
    </Button>
  );
};
