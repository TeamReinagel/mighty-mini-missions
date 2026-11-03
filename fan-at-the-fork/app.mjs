import {EPISODE,BEATS,GATES,PASSAGE} from './episode.mjs?v=cast-1';
import {launchEpisode} from '../shared/lark-nib/player.mjs?v=cast-1';
launchEpisode({EPISODE,BEATS,GATES,PASSAGE,base:new URL('./',import.meta.url)});
