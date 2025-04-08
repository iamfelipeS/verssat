import { Routes } from '@angular/router';
import { LeagueDetailsComponent } from './views/league-details/league-details.component';
import { HomeComponent } from './views/home/home.component';
import { PlayerListComponent } from './views/player-list/player-list.component';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'home', 
        pathMatch: 'full'
    },
    {
        path: 'home',
        component: HomeComponent
    },
    {
        path: 'leagueDetails/:name',
        component: LeagueDetailsComponent,
        children: [
            {
                path: '',
                redirectTo: 'overview',
                pathMatch: 'full'
            },
            {
                path: 'players',
                component: PlayerListComponent
            },
        ]
    },
    { path: '**', redirectTo: 'home' }
];
