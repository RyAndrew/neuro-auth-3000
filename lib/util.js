const util = {
  convertSessionDataUtcStringsToLocaleDates:function(token) {
    const timeClaims = ['createdAt', 'expiresAt', 'lastPasswordVerification', 'lastFactorVerification']

    //make copy of token
    let formattedToken = {}

    for (let claim in token) {
        if (timeClaims.includes(claim)) {
            formattedToken[claim] = token[claim] + ' (' + this.convertUtcStringToDateTimeString(token[claim]) + ')'
        } else {
            formattedToken[claim] = token[claim]
        }
    }
    return formattedToken
  },
  //convertTimeStampToDateTimeString:function (timestamp) {
  //    let dateToFormat = convertClaimToDate(timestamp)
  //    return dateToFormat.toLocaleDateString() + ' ' + dateToFormat.toLocaleTimeString()
  //},

  convertUtcStringToDateTimeString:function (utcString) {
      let dateToFormat = new Date(utcString)
      return dateToFormat.toLocaleDateString() + ' ' + dateToFormat.toLocaleTimeString()
  },

  getDateLocaleString: function (){
      let dateToFormat = new Date()
      return dateToFormat.toLocaleDateString() + ' ' + dateToFormat.toLocaleTimeString()
  },
  getCurrentGmtUnixTimestamp: function () {
    return Math.floor(Date.now() / 1000);
  },
}