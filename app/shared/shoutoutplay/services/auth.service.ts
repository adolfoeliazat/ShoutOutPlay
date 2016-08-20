// angular
import {Injectable} from '@angular/core';

// libs
import {Store, ActionReducer, Action} from '@ngrx/store';
import {Observable} from 'rxjs/Observable';
import {TNSSpotifyAuth} from 'nativescript-spotify';

// app
import {Analytics, AnalyticsService} from '../../analytics/index';

// analytics
const CATEGORY: string = 'Auth';

/**
 * ngrx setup start --
 */
export interface IAuthState {
  loggedIn: boolean;
  currentUser?: any;
}

const initialState: IAuthState = {
  loggedIn: false
};

export const AUTH_ACTIONS: any = {
  LOGGED_IN_CHANGE: `[${CATEGORY}] LOGGED_IN_CHANGE`,
  SET_CURRENT_USER: `[${CATEGORY}] SET_CURRENT_USER`
};

export const authReducer: ActionReducer<IAuthState> = (state: IAuthState = initialState, action: Action) => {
  let changeState = () => {
    return Object.assign({}, state, action.payload);
  };
  switch (action.type) {
    case AUTH_ACTIONS.LOGGED_IN_CHANGE:
      return changeState();
    case AUTH_ACTIONS.SET_CURRENT_USER:
      return changeState();
    default:
      return state;
  }
};
/**
 * ngrx end --
 */

@Injectable()
export class AuthService extends Analytics {
  public state$: Observable<any>;

  constructor(public analytics: AnalyticsService, private store: Store<any>) {
    super(analytics);
    this.category = CATEGORY;

    this.state$ = store.select('auth');
    store.select(state => state.auth.loggedIn).subscribe((loggedIn: boolean) => {
      console.log(`AuthService loggedIn state change: ${loggedIn}`);
      this.track(AUTH_ACTIONS.LOGGED_IN_CHANGE, { label: loggedIn.toString() });
    }); 

    TNSSpotifyAuth.VERIFY_SESSION().then(() => {
      this.setLoggedIn(true);
    }, () => {
      this.setLoggedIn(false);
    });
  }

  public login() {
    TNSSpotifyAuth.LOGIN();
  }

  private setLoggedIn(loggedIn: boolean) {
    this.store.dispatch({ type: AUTH_ACTIONS.LOGGED_IN_CHANGE, payload: { loggedIn } });
  }
}