export const checkEmailValidity = (email) => {
  if (!email) {
    return { valid: false, error: "email is required" };
  }
  
  if (!email.toLowerCase().endsWith('@iitp.ac.in')) {
    const error = new Error('Invalid Email Address.')
    throw error;
  }

  // const validRollCodes = ['AI', 'CS', 'MM', 'MC', 'MT', 'EE', 'EC', 'VL', 'PC', 'CE', 'ST', 'GT', 'CB', 'CT', 'PH', 'ME', 'CM', 'ES'];

  // const targetEmail = email.toUpperCase();
  // const targetSuffix = targetEmail.split('_')[1];
  // if(targetSuffix.length < 2) {
  //   throw new Error("Invalid Email Address.")
  // }
  // const targetRollNumber = targetSuffix.split('@')[0];

  // if(targetRollNumber.length < 6){
  //   throw new Error("Invalid Email Address.")
  // }

  // const rollCode = targetRollNumber.substring(4, 7);
  // // const isValid = validRollCodes.includes(rollCode);
  // if(rollCode === 'RES'){
  //   const error = new Error('You are not Allowed to Use this Portal.')
  //   error.code = 'NOT_ORG_MEMBER'
  //   throw error;
  // }

  // console.log(targetEmail, rollCode, targetRollNumber);

  return true;
};