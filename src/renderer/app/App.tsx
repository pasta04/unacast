import * as React from 'react';
import { Box, CssBaseline, ThemeProvider } from '@mui/material';
import { compactTheme } from './theme';
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
import { NgWord } from './sections/NgWord';
import { Other } from './sections/Other';
import { AlertDialog, ConfirmStopDialog } from './Dialogs';
import type { SectionId } from './sections';
import { useAppStore } from './store';
import { sendLoadVoicevox } from './ipc';
import { loadAudioDevicesWithRetry, refreshAudioDevicesFromEvent } from './audioDevices';

const sectionRenderers: Record<Exclude<SectionId, 'all'>, React.FC> = {
  sources: Sources,
  fetch: BbsFetch,
  display: Display,
  sound: Sound,
  yomiko: Yomiko,
  aamode: AaMode,
  translate: Translate,
  azureStt: AzureStt,
  ngword: NgWord,
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
        <NgWord />
        <Other />
      </>
    );
  }
  const Component = sectionRenderers[selected];
  return <Component />;
};

export const App: React.FC = () => {
  const [selected, setSelected] = React.useState<SectionId>('all');
  const setConfigReady = useAppStore((s) => s.setConfigReady);

  React.useEffect(() => {
    let cancelled = false;

    // 初回ロード (リトライ込み)
    loadAudioDevicesWithRetry(() => cancelled).finally(() => {
      if (!cancelled) setConfigReady(true);
    });

    // devicechange イベントで後から認識されたデバイスにも追従する
    const onDeviceChange = () => {
      if (cancelled) return;
      refreshAudioDevicesFromEvent();
    };
    navigator.mediaDevices.addEventListener('devicechange', onDeviceChange);

    // VOICEVOX が選択されている場合は初回ロード
    const config = useAppStore.getState().config;
    if (config.typeYomiko === 'voicevox' || config.typeYomikoStt === 'voicevox') {
      sendLoadVoicevox(config.voicevox);
    }
    return () => {
      cancelled = true;
      navigator.mediaDevices.removeEventListener('devicechange', onDeviceChange);
    };
  }, [setConfigReady]);

  return (
    <ThemeProvider theme={compactTheme}>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <Sidebar selected={selected} onSelect={setSelected} />
        <Box component="main" sx={{ flexGrow: 1, px: 1.5, py: 1, ml: 0, width: `calc(100% - ${sidebarWidth}px)` }}>
          <HeaderBar />
          <SectionContent selected={selected} />
          <ConfirmStopDialog />
          <AlertDialog />
        </Box>
      </Box>
    </ThemeProvider>
  );
};
