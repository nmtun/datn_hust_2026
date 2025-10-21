export const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate số điện thoại Việt Nam (bắt đầu bằng 03, 05, 07, 08, 09 và có 10 số)
export const validateVietnamPhoneNumber = (phone: string) => {
  const vnPhoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
  return vnPhoneRegex.test(phone);
};

// Validate tên, không chứa số và ký tự đặc biệt
export const validateName = (name: string) => {
  // Cho phép chữ cái, dấu cách, dấu gạch ngang, dấu gạch dưới và chữ có dấu tiếng Việt
  const nameRegex = /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾưăạảấầẩẫậắằẳẵặẹẻẽềềểếỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ\s\-_]+$/;
  return nameRegex.test(name);
};

// Validate tuổi (phải đủ 18 tuổi)
export const validateAge = (birthdate: string) => {
  const today = new Date();
  const birthDate = new Date(birthdate);
  let age = today.getFullYear() - birthDate.getFullYear();
  const month = today.getMonth() - birthDate.getMonth();
  
  // Nếu tháng sinh nhật chưa đến hoặc đã đến nhưng ngày sinh nhật chưa đến
  if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age >= 18;
};
