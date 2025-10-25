const details = (email) => {
    const rollNo = email.split('@')[0].split('_')[1];;
    console.log(rollNo);
}

