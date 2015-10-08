export default {
  api: {
    url: '/api',
  },
  walkTimes: {
    // WalkTime = walking distance in seconds
    // UnreachTime = threshold to hide unreachable connections
    Rathaus:              {walkTime: 120, unreachTime: 30},
    Schottentor:          {walkTime: 480, unreachTime: 300},
    Volkstheater:         {walkTime: 480, unreachTime: 300},
    Landesgerichtsstraße: {walkTime: 480, unreachTime: 300},
    Auerspergstraße:      {walkTime: 300, unreachTime: 180},
  },
};
