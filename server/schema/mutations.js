const graphql = require('graphql');

const { GraphQLObjectType, GraphQLString } = graphql;

const UserType = require('./types/user_type');
const PassportService = require('./../services/passport');

const mutations = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    signup: {
      type: UserType,
      args: {
        email: { type: GraphQLString },
        password: { type: GraphQLString }
      },
      resolve(parentValue, args, context) {
        const { email, password } = args;

        return PassportService.signup({ email, password, req: context.req });
      }
    },
    logout: {
      type: UserType,
      resolve(parentValue, args, context) {
        // Extract the currently Logged In User
        const currentUser = context.req.user;

        // Logout the user: Refer - http://www.passportjs.org/docs/logout/
        context.req.logOut();

        // Return the Logged Out User
        return currentUser;
      }
    },
    login: {
      type: UserType,
      args: {
        email: { type: GraphQLString },
        password: { type: GraphQLString }
      },
      resolve(parentValue, args, context) {
        const { email, password } = args;
        const { req } = context;

        return PassportService.login({ email, password, req });
      }
    }
  }
});

module.exports = mutations;
