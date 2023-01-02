
export const validateEmail = (email: string) => {
	var regex = /\S+@\S+\.\S+/;
	return regex.test(email);
};
