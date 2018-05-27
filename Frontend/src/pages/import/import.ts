import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, LoadingController, ToastController } from 'ionic-angular';

import { RecipeServiceProvider } from '../../providers/recipe-service/recipe-service';

@IonicPage({
  priority: 'low'
})
@Component({
  selector: 'page-import',
  templateUrl: 'import.html',
  providers: [ RecipeServiceProvider ]
})
export class ImportPage {
  
  username: string;
  password: string;

  constructor(
    public navCtrl: NavController,
    public loadingCtrl: LoadingController,
    public toastCtrl: ToastController,
    public recipeService: RecipeServiceProvider,
    public navParams: NavParams) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ImportPage');
  }
  
  scrapePepperplate() {
    var me = this;
    
    let loading = this.loadingCtrl.create({
      content: 'Starting import...',
      dismissOnPageChange: true
    });
  
    loading.present();
    
    this.recipeService.scrapePepperplate({
      username: this.username,
      password: this.password
    }).subscribe(function(response) {
      loading.dismiss();
      
      me.toastCtrl.create({
        message: 'We\'ll start importing your recipes shortly! We\'ll alert you when the process begins.',
        duration: 6000
      }).present();
      
      me.navCtrl.setRoot('HomePage', { folder: 'main' }, {animate: true, direction: 'forward'});
    }, function(err) {
      loading.dismiss();
      switch(err.status) {
        case 401:
          me.toastCtrl.create({
            message: 'You are not authorized for this action! If you believe this is in error, please logout and login using the side menu.',
            duration: 6000
          }).present();
          break;
        default:
          me.toastCtrl.create({
            message: 'An unexpected error occured. Please try again.',
            duration: 6000
          }).present();
          break;
      }
    });
  }

}
