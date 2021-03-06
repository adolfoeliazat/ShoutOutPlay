// angular
import {NgZone, ViewContainerRef, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Location} from '@angular/common';

// nativescript
import {ModalDialogService, ModalDialogOptions} from "nativescript-angular";
import * as dialogs from 'ui/dialogs';
import {topmost} from 'ui/frame';
import * as utils from 'utils/utils';

// libs
import {Store} from '@ngrx/store';

// app
import {AnimateService, LogService, BaseComponent, FancyAlertService, Config} from '../../shared/core/index';
import {PlaylistService, IPlaylistState, PlaylistModel, ShoutoutModel, PLAYER_ACTIONS, PLAYLIST_ACTIONS, TrackModel, FIREBASE_ACTIONS, IFirebaseState, FirebaseService, ShoutoutService, TrackControlService, SearchService, SOPUtils} from '../../shared/shoutoutplay/index';
import {ShoutOutDetailComponent} from '../shoutout/shoutout-detail.component';

@BaseComponent({
  // moduleId: module.id,
  selector: 'playlist-detail',
  templateUrl: './components/playlist/playlist-detail.component.html'
  // providers: [ModalDialogService]
})
export class PlaylistDetailComponent implements OnInit {
  public playlistIndex: number;
  private _playlist: PlaylistModel;
  private _swipedView: any;
  private _currentIndex: number;

  constructor(private store: Store<any>, private logger: LogService, public playlistService: PlaylistService, private firebaseService: FirebaseService, private ar: ActivatedRoute, private vcRef: ViewContainerRef, private modal: ModalDialogService, private fancyalert: FancyAlertService, private ngZone: NgZone, private router: Router, private shoutoutService: ShoutoutService, private location: Location, private trackControl: TrackControlService, private searchService: SearchService) {
    logger.debug(`PlaylistDetailComponent constructor`);
  }  

  public togglePlay(playlistId: string, track: TrackModel) {
    this.getShoutout(track.shoutoutId).then((shoutout) => {
      let activeShoutOutPath: string = shoutout ? shoutout.filename : null;
      this.store.dispatch({
        type: PLAYER_ACTIONS.LIST_TOGGLE_PLAY,
        payload: {
          activeList: 'playlists',
          trackId: track.id,
          playlistId,
          activeShoutOutPath
        }
      });
    });
  }

  public viewShoutout(track: TrackModel) {
    this.ngZone.run(() => {
      if (track.shoutoutId) {
        this.getShoutout(track.shoutoutId).then((shoutout) => {
          this.trackControl.openShareOptions(shoutout, track);
        });
      } else {
        Config.SELECTED_PLAYLIST_ID = this._playlist.id;
        this.searchService.quickRecordTrack = track;
        this.router.navigate(['/record']);
      }
    });
  }

  public editPlaylist() {
    this.playlistService.edit(this._playlist).then((p) => {
      this._playlist.name = p.name;
      var actionBar = topmost().currentPage.actionBar;
      actionBar.title = p.name;
    });
  }

  public edit() {
    let track = this._playlist.tracks[this._currentIndex];
    if (track.shoutoutId) {
      let options: ModalDialogOptions = {
        context: { track },
        viewContainerRef: this.vcRef,
        fullscreen: true
      };
      this.modal.showModal(ShoutOutDetailComponent, options).then(() => {
        
      });
    } else {
      this.fancyalert.show('If a ShoutOut were on this track, you would be able to remove it to re-record a different one using this button.');
    }
  }

  public remove(e: any) {
    this.fancyalert.confirm('Are you sure you want to remove this track?', 'warning', () => {
      let playlistId = this._playlist.id;
      let track = this._playlist.tracks[this._currentIndex];
      if (track.shoutoutId) {
        // TODO: remove shoutout here via shoutoutService
        // Or change these to PROCESS_UPDATES for both (playlist/shoutouts)
      }
      this.store.dispatch({ type: FIREBASE_ACTIONS.DELETE_TRACK, payload: { track, playlistId } });
      // AnimateService.SWIPE_RESET(this._swipedView);
    });
  }

  public androidBack() {
    setTimeout(() => {
      this.location.back();
    });
  }

  // public swipeReveal(e: any) {
  //   this._swipedView = AnimateService.SWIPE_REVEAL(e);
  // }

  public onSwipeCellStarted(args: any) {
    let density = utils.layout.getDisplayDensity();
    let delta = Math.floor(density) !== density ? 1.1 : .1;
    var swipeLimits = args.data.swipeLimits;  
    swipeLimits.top = 0;
    swipeLimits.bottom = 0;
    swipeLimits.left = Math.round(density * 100);
    swipeLimits.right = Math.round(density * 100);
    swipeLimits.threshold = Math.round(density * 50);
  }

  public onSwipeCellFinished(args: any) {
    this._currentIndex = args.itemIndex;
  }

  public onItemReordered(args: any) {
    this.logger.debug("Item reordered. Old index: " + args.itemIndex + " " + "new index: " + args.data.targetIndex);
    this.store.dispatch({ type: FIREBASE_ACTIONS.REORDER, payload: { type: 'track', itemIndex: args.itemIndex, targetIndex: args.data.targetIndex, playlist: this._playlist } });
  }

  private getShoutout(shoutoutId: string): Promise<ShoutoutModel> {
    return new Promise((resolve, reject) => {
      this.store.take(1).subscribe((state: any) => {
        let results = state.firebase.shoutouts.filter(s => s.id == shoutoutId);
        if (results.length) {
          resolve(results[0]);
        } else {
          resolve(null);
        }
      });
    });
  }

  ngOnInit() {
    this.ar.params.map(r => r['id']).take(1).subscribe((id: string) => {
      console.log(`PlaylistDetailComponent id: ${id}`);
      this.store.take(1).subscribe((s: any) => {
        for (let i = 0; i < s.firebase.playlists.length; i++) {
          if (s.firebase.playlists[i].id === id) {
            this._playlist = Object.assign({id: id}, s.firebase.playlists[i]);
            this.playlistIndex = i;
            break;
          }
        }
      });
    });
  }
}