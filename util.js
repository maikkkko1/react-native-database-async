/**
 * @author Maikon Ferreira
 * @email mai.kon96@hotmail.com
 * @create date 2020-02-11 19:58:41
 * @modify date 2020-02-11 19:58:41
 * @desc Util methods.
 */

export default class Util {
  static isValid(val) {
    return val != "" && val != null && val != undefined;
  }

  static getDate(additionalMinutes = null) {
    const baseDate = new Date();
    const date = new Date(
      baseDate.valueOf() - baseDate.getTimezoneOffset() * 60000
    );

    if (additionalMinutes) {
      return new Date(date.getTime() + additionalMinutes * 60000).toISOString();
    }

    return date.toISOString();
  }
}
