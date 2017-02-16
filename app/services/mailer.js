module.exports = {
  sendPasswordResetEmail(/* email, resetCode */) {
    // generate a link for the user to navigate to the website and reset their password
    // reset password link will navigate to a form on the management site
    // that allows the user to reset their password using a reset code in the URL
    // TODO: email the password to the requested email
    return Promise.resolve(true)
  }
}
