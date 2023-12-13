import { min } from 'lodash';
import { validateEmail } from './validateEmail';
import { faker } from '@faker-js/faker';

describe('when email is valid', () => {
  const validEmails = [
    'example@example.com',
    'firstname.lastname@example.com',
    'email@subdomain.example.com',
    'firstname+lastname@example.com',
    '1234567890@example.com',
    'email@example-one.com',
    '_______@example.com',
    'email@example.co.jp',
    'firstname-lastname@example.com'
  ];

  validEmails.forEach(email => {
    it(`should return true for ${email}`, () => {
      expect(validateEmail(email)).toBe(true);
    });
  });

  test('should handle emails with long local part', () => {
    const longLocalPartEmail = 'a'.repeat(faker.number.int({min: 65, max: 256})) + '@example.com';
    expect(validateEmail(longLocalPartEmail)).toBe(false);
  });
  
  test('should handle emails with long domain part', () => {
    const longDomainPartEmail = 'example@' + 'a'.repeat(faker.number.int({min: 65, max: 200})) + '.com';
    expect(validateEmail(longDomainPartEmail)).toBe(false);
  });

});

describe('when email is invalid', () => {
  const invalidEmails = [
    'plainaddress',
    '@no-local-part.com',
    'Outlook Contact <outlook-contact@domain.com>',
    'no-at-sign.net',
    'no-tld@domain',
    ';beginning-semicolon@semicolon.com',
    'middle-semicolon@domain.co;m',
    'trailing-semicolon@domain.com;',
    '"email"@example.com',
    'email@domain@domain.com',
    '.email@domain.com',
    'email.@domain.com',
    'email..email@domain.com',
    'あいうえお@example.com',
    'email@domain.com (Joe Smith)',
    'email@domain',
    'email@-domain.com',
    'email@111.222.333.44444',
    'email@domain..com'
  ];

  invalidEmails.forEach((email) => {
    it(`should return false for ${email}`, () => {
      expect(validateEmail(email)).toBe(false);
    });
  })

  test('should return false for empty string', () => {
    expect(validateEmail('')).toBe(false);
  });
  
  test('should return false for null or undefined', () => {
    expect(validateEmail(null)).toBe(false);
    expect(validateEmail(undefined)).toBe(false);
  });

});
