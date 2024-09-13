import fs from 'fs';
export const readWavFiles = (path: string): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    fs.readdir(path, (err, files) => {
      if (err) reject(err);
      const fileList = files.filter((file) => {
        return isExistFile(path + '/' + file) && /.*\.wav$/.test(file); //絞り込み
      });
      resolve(fileList);
    });
  });
};

const isExistFile = (file: string) => {
  try {
    fs.statSync(file).isFile();
    return true;
  } catch (err: any) {
    if (err.code === 'ENOENT') return false;
  }
};

export const sleep = (msec: number) => new Promise((resolve) => setTimeout(resolve, msec));

export const escapeHtml = (string: string): string => {
  if (typeof string !== 'string') {
    return string;
  }
  return string.replace(/[&'`"<>]/g, (match) => {
    return (
      {
        '&': '&amp;',
        "'": '&#x27;',
        '`': '&#x60;',
        '"': '&quot;',
        '<': '&lt;',
        '>': '&gt;',
      } as any
    )[match];
  });
};

export const unescapeHtml = (str: string) => {
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x60;/g, '`')
    .replace(/&#044;/g, ',')
    .replace(/&amp;/g, '&');
};

export const convertUrltoImgTagSrc = (imgUrl: string) => {
  return imgUrl.match(/.+\.(jpg|png|gif)$/) ? imgUrl : `data:image/png;base64,${imgUrl}`;
};

export const judgeAaMessage = (messageList: UserComment[]) => {
  return messageList.map((message) => {
    let isAA = false;
    if (config.aamode.enable) {
      if (config.aamode.condition.length <= message.text.length) isAA = true;
      for (const word of config.aamode.condition.words) {
        if (message.text.includes(word)) isAA = true;
      }
    }

    return {
      ...message,
      isAA,
    };
  });
};

/** 日本語のテキストか */
export const isNihongo = (message: string) => {
  const reg = new RegExp('.*[ぁ-んァ-ヶ亜-熙ａ-ｚＡ-Ｚ]+.*');

  return reg.test(message);
};
