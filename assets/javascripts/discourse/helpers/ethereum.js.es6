import { registerHelper } from 'discourse-common/lib/helpers';

export default registerHelper("eq", function(params) {
  return params[0] == params[1];
});
