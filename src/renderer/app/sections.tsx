import * as React from 'react';
import DashboardIcon from '@mui/icons-material/Dashboard';
import RssFeedIcon from '@mui/icons-material/RssFeed';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import FontDownloadIcon from '@mui/icons-material/FontDownload';
import TranslateIcon from '@mui/icons-material/Translate';
import MicIcon from '@mui/icons-material/Mic';
import TuneIcon from '@mui/icons-material/Tune';
import BlockIcon from '@mui/icons-material/Block';

export type SectionId = 'all' | 'sources' | 'fetch' | 'display' | 'sound' | 'yomiko' | 'aamode' | 'translate' | 'sherpaStt' | 'ngword' | 'other';

export type SectionDef = {
  id: SectionId;
  label: string;
  icon: React.ReactNode;
};

export const sections: SectionDef[] = [
  { id: 'all', label: '全設定', icon: <DashboardIcon /> },
  { id: 'sources', label: 'レス・コメント取得先', icon: <RssFeedIcon /> },
  { id: 'fetch', label: '掲示板取得設定', icon: <DownloadIcon /> },
  { id: 'display', label: '表示設定', icon: <VisibilityIcon /> },
  { id: 'sound', label: 'レス・コメント着信音', icon: <VolumeUpIcon /> },
  { id: 'yomiko', label: '読み子設定', icon: <RecordVoiceOverIcon /> },
  { id: 'aamode', label: 'AAモード', icon: <FontDownloadIcon /> },
  { id: 'translate', label: 'レス翻訳(実験的)', icon: <TranslateIcon /> },
  { id: 'sherpaStt', label: 'ローカル音声認識', icon: <MicIcon /> },
  { id: 'ngword', label: 'NGワード', icon: <BlockIcon /> },
  { id: 'other', label: 'その他', icon: <TuneIcon /> },
];
