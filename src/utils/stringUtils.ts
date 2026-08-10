export const removeAccents = (str: string): string => {
  return str
    .normalize('NFD') // Tách các ký tự có dấu thành ký tự gốc và dấu
    .replace(/[\u0300-\u036f]/g, '') // Loại bỏ các dấu
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
};
