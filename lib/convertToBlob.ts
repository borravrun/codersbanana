export const downloadImage = (base64String: string) => {
  // Strip prefix if present
  const base64 = base64String.includes(',') 
    ? base64String.split(',')[1] 
    : base64String;

  // Convert to Blob
  const byteCharacters = atob(base64);
  const byteArray = new Uint8Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteArray[i] = byteCharacters.charCodeAt(i);
  }
  
  const blob = new Blob([byteArray], { type: 'image/png' });

  // Create object URL and trigger download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'CodersBanana' + new Date().toISOString() + '.png';
  a.click();

  URL.revokeObjectURL(url);
};