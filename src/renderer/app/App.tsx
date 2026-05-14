import * as React from 'react';
import { Box, CssBaseline } from '@mui/material';
import { Sidebar, sidebarWidth } from './Sidebar';
import { HeaderBar } from './HeaderBar';
import { Sources } from './sections/Sources';
import { BbsFetch } from './sections/BbsFetch';
import { Display } from './sections/Display';
import { Sound } from './sections/Sound';
import { Yomiko } from './sections/Yomiko';
import { AaMode } from './sections/AaMode';
import { Translate } from './sections/Translate';
import { AzureStt } from './sections/AzureStt';
import { Other } from './sections/Other';
import { AlertDialog, ConfirmStopDialog } from './Dialogs';
import type { SectionId } from './sections';
import { useAppStore } from './store';
import { sendLoadVoicevox } from './ipc';

const sectionRenderers: Record<Exclude<SectionId, 'all'>, React.FC> = {
  sources: Sources,
  fetch: BbsFetch,
  display: Display,
  sound: Sound,
  yomiko: Yomiko,
  aamode: AaMode,
  translate: Translate,
  azureStt: AzureStt,
  other: Other,
};

const SectionContent: React.FC<{ selected: SectionId }> = ({ selected }) => {
  if (selected === 'all') {
    return (
      <>
        <Sources />
        <BbsFetch />
        <Display />
        <Sound />
        <Yomiko />
        <AaMode />
        <Translate />
        <AzureStt />
        <Other />
      </>
    );
  }
  const Component = sectionRenderers[selected];
  return <Component />;
};

export const App: React.FC = () => {
  const [selected, setSelected] = React.useState<SectionId>('all');
  const setAudioOutputs = useAppStore((s) => s.setAudioOutputs);
  const setAudioInputs = useAppStore((s) => s.setAudioInputs);
  const setConfigReady = useAppStore((s) => s.setConfigReady);

  React.useEffect(() => {
    let cancelled = false;
    const loadDevices = async () => {
      try {
        await new Promise((r) => setTimeout(r, 500));
        const devices = await navigator.mediaDevices.enumerateDevices();
        if (cancelled) return;
        setAudioOutputs(
          devices
            .filter((d) => d.kind === 'audiooutput')
            .map((d) => ({ deviceId: d.deviceId, label: d.label })),
        );
        setAudioInputs(
          devices
            .filter((d) => d.kind === 'audioinput')
            .map((d) => ({ deviceId: d.deviceId, label: d.label })),
        );
      } catch (e) {
        useAppStore.getState().openAlert('オーディオデバイスの読み込みに失敗しました');
      } finally {
        if (!cancelled) {
          setConfigReady(true);
        }
      }
    };
    loadDevices();

    // VOICEVOX が選択されている場合は初回ロード
    const config = useAppStore.getState().config;
    if (config.typeYomiko === 'voicevox' || config.typeYomikoStt === 'voicevox') {
      sendLoadVoicevox(config.voicevox);
    }
    return () => {
      cancelled = true;
    };
  }, [setAudioOutputs, setAudioInputs, setConfigReady]);

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Sidebar selected={selected} onSelect={setSelected} />
      <Box component="main" sx={{ flexGrow: 1, p: 2, ml: 0, width: `calc(100% - ${sidebarWidth}px)` }}>
        <HeaderBar />
        <SectionContent selected={selected} />
        <ConfirmStopDialog />
        <AlertDialog />
      </Box>
    </Box>
  );
};
