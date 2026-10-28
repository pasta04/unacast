import * as React from 'react';
import { Box, Button, Checkbox, FormControlLabel, MenuItem, TextField, Typography } from '@mui/material';
import { useAppStore } from '../store';
import { invokeGetChatWindowMode, invokeSetChatWindowMode, sendChatWindowCss, subscribeChatWindowMode } from '../ipc';
import type { ChatWindowMode } from '../../../main/chatWindowMode';
import { CSS_PROPERTIES, CSS_TARGETS, buildCssValue, buildPreviewDocument, upsertCssDeclaration } from '../chatWindowCss';
import { SectionPanel, Caption, HelpPopover } from './common';

/**
 * ウィンドウの表示モード (最前面・枠なし/背景透過・クリック透過)。
 * config ではなく main が持つウィンドウ設定なので、「適用」を待たずにすぐ切り替える。
 * チャットウィンドウの右クリックメニューからの変更も購読して表示を合わせる。
 */
const ChatWindowModeControls: React.FC = () => {
  const [mode, setMode] = React.useState<ChatWindowMode | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    void invokeGetChatWindowMode().then((m) => active && setMode(m));
    const unsubscribe = subscribeChatWindowMode(setMode);
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const update = (patch: Partial<ChatWindowMode>) => {
    setBusy(true);
    void invokeSetChatWindowMode(patch)
      .then(setMode)
      .finally(() => setBusy(false));
  };

  const disabled = !mode || busy;
  return (
    <Box sx={{ mb: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
          ウィンドウの表示
        </Typography>
        <HelpPopover>
          <Box>ゲーム画面などの上に重ねてコメントを見る時に使います。チャットウィンドウの右クリックメニューからも切り替えられます。</Box>
          <Box sx={{ mt: 1 }}>
            枠なし・背景透過: タイトルバーを消し、背景を半透明にします。移動はウィンドウ上端のつまみ (マウスを乗せると表示) をドラッグします。背景の濃さは下の CSS の body の
            background-color で変えられます。
          </Box>
          <Box sx={{ mt: 1 }}>
            クリック透過:
            マウス操作が後ろのウィンドウに届くようになります。有効中はチャットウィンドウを操作できないため、解除はこの画面から行ってください。アプリを再起動しても解除されます。
          </Box>
        </HelpPopover>
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', columnGap: 2 }}>
        <FormControlLabel
          control={<Checkbox size="small" checked={mode?.alwaysOnTop ?? false} disabled={disabled} onChange={(e) => update({ alwaysOnTop: e.target.checked })} />}
          label="最前面に表示"
        />
        <FormControlLabel
          control={<Checkbox size="small" checked={mode?.frameless ?? false} disabled={disabled} onChange={(e) => update({ frameless: e.target.checked })} />}
          label="枠なし・背景透過"
        />
        <FormControlLabel
          control={<Checkbox size="small" checked={mode?.clickThrough ?? false} disabled={disabled} onChange={(e) => update({ clickThrough: e.target.checked })} />}
          label="クリック透過"
        />
      </Box>
    </Box>
  );
};

/** 「項目を選んで挿入」: 対象・項目・値を選んで、CSS の該当ブロックに書き込む */
const CssInsertHelper: React.FC<{ onInsert: (selector: string, property: string, value: string) => void }> = ({ onInsert }) => {
  const [selector, setSelector] = React.useState<string>(CSS_TARGETS[0].selector);
  const [propertyKey, setPropertyKey] = React.useState<string>(CSS_PROPERTIES[0].key);
  const [pxValue, setPxValue] = React.useState('20');
  const [numberValue, setNumberValue] = React.useState('1.5');
  const [colorValue, setColorValue] = React.useState('#ffffff');

  const def = CSS_PROPERTIES.find((p) => p.key === propertyKey) ?? CSS_PROPERTIES[0];
  const input = def.kind === 'px' ? pxValue : def.kind === 'number' ? numberValue : def.kind === 'color' ? colorValue : '';
  const value = buildCssValue(def, input);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
      <TextField select size="small" label="対象" value={selector} onChange={(e) => setSelector(e.target.value)} sx={{ minWidth: 200 }}>
        {CSS_TARGETS.map((t) => (
          <MenuItem key={t.selector} value={t.selector}>
            {t.label} ({t.selector})
          </MenuItem>
        ))}
      </TextField>
      <TextField select size="small" label="項目" value={propertyKey} onChange={(e) => setPropertyKey(e.target.value)} sx={{ minWidth: 160 }}>
        {CSS_PROPERTIES.map((p) => (
          <MenuItem key={p.key} value={p.key}>
            {p.label}
          </MenuItem>
        ))}
      </TextField>
      {def.kind === 'px' && (
        <TextField
          size="small"
          label="値 (px)"
          value={pxValue}
          onChange={(e) => setPxValue(e.target.value)}
          error={value === null}
          sx={{ width: 100 }}
          slotProps={{ htmlInput: { inputMode: 'decimal' } }}
        />
      )}
      {def.kind === 'number' && (
        <TextField
          size="small"
          label="値"
          value={numberValue}
          onChange={(e) => setNumberValue(e.target.value)}
          error={value === null}
          sx={{ width: 100 }}
          slotProps={{ htmlInput: { inputMode: 'decimal' } }}
        />
      )}
      {def.kind === 'color' && <TextField size="small" type="color" label="色" value={colorValue} onChange={(e) => setColorValue(e.target.value)} sx={{ width: 100 }} />}
      <Button variant="outlined" size="small" disabled={value === null} onClick={() => value !== null && onInsert(selector, def.property, value)}>
        挿入
      </Button>
      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
        {value !== null ? `${selector} { ${def.property}: ${value}; }` : '値が正しくありません'}
      </Typography>
    </Box>
  );
};

/** 設定画面内のプレビュー。チャットウィンドウと同じ CSS 構成で、サンプルのコメントに入力中の CSS を当てる */
const ChatWindowPreview: React.FC<{ css: string }> = ({ css }) => {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  // 文書は最初の 1 回だけ作り、以降は style 要素の中身だけ書き換える (入力のたびの再読み込みとちらつきを避ける)
  const [srcDoc] = React.useState(() => buildPreviewDocument(window.location.href, css));

  const applyCss = React.useCallback(() => {
    const style = iframeRef.current?.contentDocument?.getElementById('user-css');
    if (style) style.textContent = css;
  }, [css]);

  React.useEffect(applyCss, [applyCss]);

  return (
    <Box
      sx={{
        width: 400,
        height: 360,
        minWidth: 200,
        minHeight: 160,
        maxWidth: '100%',
        // チャットウィンドウの幅を変えた時の見え方も確認できるよう、右下をドラッグして大きさを変えられる
        resize: 'both',
        overflow: 'hidden',
        border: 1,
        borderColor: 'divider',
      }}
    >
      <iframe ref={iframeRef} title="チャットウィンドウのプレビュー" srcDoc={srcDoc} onLoad={applyCss} style={{ width: '100%', height: '100%', border: 0, display: 'block' }} />
    </Box>
  );
};

export const ChatWindowStyle: React.FC = () => {
  const css = useAppStore((s) => s.config.chatWindowCss);
  const appliedCss = useAppStore((s) => s.appliedConfig.chatWindowCss);
  const setConfig = useAppStore((s) => s.setConfig);
  const applyChatWindowCss = useAppStore((s) => s.applyChatWindowCss);
  const isDirty = css !== appliedCss;

  const handleApply = () => {
    applyChatWindowCss();
    sendChatWindowCss(css);
  };

  return (
    <SectionPanel
      title="チャットウィンドウのスタイル"
      help={
        <>
          <Box>手元で確認するチャットウィンドウの見た目 (文字サイズ・色・背景など) を CSS で変更します。配信画面 (OBS) には影響しません。</Box>
          <Box sx={{ mt: 1 }}>
            「ウィンドウの表示」の最前面・枠なし/背景透過・クリック透過は、チェックするとすぐ切り替わります
            (「適用」は不要)。枠なし/背景透過を切り替えると、チャットウィンドウを作り直します (表示中のコメントは引き継ぎます)。
          </Box>
          <Box sx={{ mt: 1 }}>
            「項目を選んで挿入」で対象と項目を選ぶと、下の CSS に書き込まれます。同じ対象のブロックがあれば、その中の値を置き換えます。CSS を直接書いても構いません。
          </Box>
          <Box sx={{ mt: 1 }}>編集中の内容は右のプレビューにすぐ反映されます。「適用」を押すと保存され、チャットウィンドウに反映されます。</Box>
          <Box sx={{ mt: 1 }}>resources フォルダの style-server.css を使っている場合は、それより後に読み込まれるため、こちらの設定が優先されます。</Box>
        </>
      }
    >
      <Caption>手元のチャットウィンドウの見た目を変更します。配信画面 (OBS) には影響しません。</Caption>
      <ChatWindowModeControls />
      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
        スタイル (CSS)
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <Box sx={{ flex: '1 1 420px', minWidth: 320 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
            項目を選んで挿入
          </Typography>
          <CssInsertHelper onInsert={(selector, property, value) => setConfig('chatWindowCss', upsertCssDeclaration(css, selector, property, value))} />
          <TextField
            multiline
            fullWidth
            minRows={12}
            maxRows={30}
            value={css}
            onChange={(e) => setConfig('chatWindowCss', e.target.value)}
            placeholder={'body {\n  font-size: 20px;\n  background-color: #000000;\n}'}
            slotProps={{ htmlInput: { spellCheck: false, style: { fontFamily: 'monospace', fontSize: 13 } } }}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
            <Button variant="contained" size="small" disabled={!isDirty} onClick={handleApply}>
              適用
            </Button>
            <Button size="small" disabled={!isDirty} onClick={() => setConfig('chatWindowCss', appliedCss)}>
              元に戻す
            </Button>
            {isDirty && (
              <Typography variant="caption" color="warning.main">
                未適用の変更があります
              </Typography>
            )}
          </Box>
        </Box>
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
            プレビュー
          </Typography>
          <ChatWindowPreview css={css} />
        </Box>
      </Box>
    </SectionPanel>
  );
};
