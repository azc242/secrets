## Secrets
Web app clone of (old school) [Whisper](http://whisper.sh/), where users sign up and anonymously post secrets or confessions.

## Motivation
This project was first built to learn handling user acccounts and passwords. Throughout the process, I used and worked with various methods of authentication and security such as basic encryption, MD5 hashing, bcrypt hashing and salting, as well as OAuth 2.0. I thought it would be fun and useful to integrate different APIs for OAuth 2.0 such as Google, Facebook, and Reddit API so that I know how to use them for future apps.

## Tech/framework used
<b>Built with</b>
- [Node.js](https://nodejs.org/en/)
- [Express.js](http://expressjs.com/)
- [Embedded JavaScript Templating](http://ejs.co/)
- [MongoDB/Mongoose](https://mongoosejs.com/)
- [Passport.js](http://www.passportjs.org/)
- [express-session](https://www.npmjs.com/package/express-session)

## Usage
Simple go to the [web application](https://secrets-confessions.herokuapp.com/) and register if you do not yet have an account. You can do so using email and password or through Google, Facebook, or Reddit. Then, you may submit a secret. If you enter another secret, the original one will be replaced. You can also opt to delete your own secret by hitting the red "Delete My Secret" button. 
