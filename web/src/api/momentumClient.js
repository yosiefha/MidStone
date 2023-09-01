import axios from "axios";
import BindingClass from "../util/bindingClass";
import Authenticator from "./authenticator";

/**
 * Client to call Momentum.
 *
 * This could be a great place to explore Mixins. Currently the client is being loaded multiple times on each page,
 * which we could avoid using inheritance or Mixins.
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes#Mix-ins
 * https://javascript.info/mixins
  */

export default class MomentumClient extends BindingClass {
    constructor(props = {}) {
        super();

        const methodsToBind = ['clientLoaded', 'getIdentity', 'login', 'logout', 'createEvent'];
        this.bindClassMethods(methodsToBind, this);

        this.authenticator = new Authenticator();;
        this.props = props;

        axios.defaults.baseURL = process.env.API_BASE_URL;
        this.axiosClient = axios;
        this.clientLoaded();
    }

     /**
     * Run any functions that are supposed to be called once the client has loaded successfully.
     */
    clientLoaded() {
        if (this.props.hasOwnProperty("onReady")) {
            this.props.onReady(this);
        }
    }

    /**
     * Get the identity of the current user
     * @param errorCallback (Optional) A function to execute if the call fails.
     * @returns The user information for the current user.
     */
    async getIdentity(errorCallback) {
        try {
            const isLoggedIn = await this.authenticator.isUserLoggedIn();

            if (!isLoggedIn) {
                 return undefined;
            }

             return await this.authenticator.getCurrentUserInfo();
        } catch (error) {
            this.handleError(error, errorCallback)
        }
    }

    async login() {
        this.authenticator.login();
     }

    async logout() {
        this.authenticator.logout();
    }

    async getTokenOrThrow(unauthenticatedErrorMessage) {
        const isLoggedIn = await this.authenticator.isUserLoggedIn();
        if (!isLoggedIn) {
          throw new Error(unauthenticatedErrorMessage);
        }

        return await this.authenticator.getUserToken();
    }

    async createEvent(goalId, dateOfEvent, measurement){
        try {
            const token = await this.getTokenOrThrow("Only authenticated users can create playlists.");
            const response = await this.axiosClient.post(`events`, {
                goalId: goalId,
                dateOfEvent: dateOfEvent,
                measurement: measurement
            }, {
                headers: {
                   Authorization: `Bearer ${token}`
                }
            });
            return response.data.event;
        } catch (error) {
            this.handleError(error, errorCallback)
        }

    }

      /**
       * Helper method to log the error and run any error functions.
       * @param error The error received from the server.
       * @param errorCallback (Optional) A function to execute if the call fails.
       */
    handleError(error, errorCallback) {
        console.error(error);

        const errorFromApi = error?.response?.data?.error_message;
        if (errorFromApi) {
          console.error(errorFromApi)
          error.message = errorFromApi;
        }

        if (errorCallback) {
          errorCallback(error);
        }
    }
}