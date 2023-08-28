// https://gist.github.com/danallison/3ec9d5314788b337b682
export function downloadString(
  text: string,
  fileType: string,
  fileName: string,
) {
  const blob = new Blob([text], { type: fileType });

  const a = document.createElement('a');

  a.download = fileName;
  a.href = URL.createObjectURL(blob);
  a.dataset.downloadurl = [fileType, a.download, a.href].join(':');
  a.style.display = 'none';

  document.body.append(a);

  a.click();

  a.remove();

  // Revoking the ObjectURL does not interfere with the download. I tested this
  // by setting the timeout to `0`.
  setTimeout(function () {
    URL.revokeObjectURL(a.href);
  }, 1500);

  return false;
}

export async function copyToClipboard(text: string) {
  return navigator.clipboard.writeText(text);
}
