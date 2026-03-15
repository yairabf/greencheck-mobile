export const strings = {
  // Auth screen
  'auth.title': { en: 'GreenCheck', he: 'GreenCheck' },
  'auth.signIn': { en: 'Sign in to your account', he: 'התחבר לחשבון שלך' },
  'auth.signUp': { en: 'Create account to join your team', he: 'צור חשבון כדי להצטרף לצוות' },
  'auth.email': { en: 'Email', he: 'אימייל' },
  'auth.password': { en: 'Password', he: 'סיסמה' },
  'auth.signInButton': { en: 'Sign In', he: 'התחבר' },
  'auth.signUpButton': { en: 'Sign Up', he: 'הירשם' },
  'auth.alreadyHaveAccount': { en: 'Already have an account? Sign In', he: 'כבר יש לך חשבון? התחבר' },
  'auth.noAccount': { en: "Don't have an account? Sign Up", he: 'אין לך חשבון? הירשם' },

  // Home screen
  'home.dashboard': { en: 'Team Dashboard', he: 'לוח בקרה' },
  'home.hi': { en: 'Hi', he: 'שלום' },
  'home.teamStatus': { en: 'Team status', he: 'סטטוס הצוות' },
  'home.inTeams': { en: 'You are in {count} team(s)', he: 'אתה ב-{count} צוותים' },
  'home.noTeam': { en: 'No team yet', he: 'עדיין אין צוות' },
  'home.activeCheck': { en: 'Active check', he: 'בדיקה פעילה' },
  'home.activeIncident': { en: 'Active incident: {id}', he: 'אירוע פעיל: {id}' },
  'home.noActiveCheck': { en: 'No active safety check right now', he: 'אין בדיקת בטיחות פעילה כרגע' },
  'home.pushStatus': { en: 'Push status', he: 'סטטוס התראות' },
  'home.pushRegistered': { en: 'Push token registered', he: 'התראות רשומות' },
  'home.push': { en: 'Push: {status}', he: 'התראות: {status}' },
  'home.retryPush': { en: 'Retry Push Registration', he: 'נסה שוב רישום התראות' },
  'home.teammates': { en: 'Teammates', he: 'חברי צוות' },
  'home.teammatesStatus': { en: '{green} Green • {notGreen} Not Green • {noResponse} No Response', he: '{green} בסדר • {notGreen} לא בסדר • {noResponse} לא הגיב' },
  'home.triggerCheck': { en: 'Trigger Safety Check', he: 'הפעל בדיקת בטיחות' },
  'home.triggering': { en: 'Triggering...', he: 'מפעיל...' },
  'home.imGreen': { en: "I'm Green", he: 'אני בסדר' },
  'home.notGreen': { en: 'Not Green', he: 'לא בסדר' },
  'home.submitting': { en: 'Submitting...', he: 'שולח...' },
  'home.endCheck': { en: 'End Safety Check', he: 'סיים בדיקת בטיחות' },
  'home.ending': { en: 'Ending...', he: 'מסיים...' },
  'home.sendReminder': { en: 'Send Reminder to Non-Responders', he: 'שלח תזכורת לאלו שלא הגיבו' },
  'home.sendingReminder': { en: 'Sending Reminder...', he: 'שולח תזכורת...' },
  'home.incidentRoster': { en: 'Incident roster', he: 'רשימת משתתפים' },
  'home.createTeam': { en: 'Create Team', he: 'צור צוות' },
  'home.joinTeam': { en: 'Join Team', he: 'הצטרף לצוות' },
  'home.signOut': { en: 'Sign out', he: 'התנתק' },

  // Team screen
  'team.title': { en: 'Team', he: 'צוות' },
  'team.yourTeam': { en: 'Your Team', he: 'הצוות שלך' },
  'team.teamId': { en: 'Team ID', he: 'מזהה צוות' },
  'team.members': { en: 'Members', he: 'חברים' },
  'team.inviteMember': { en: 'Invite Member', he: 'הזמן חבר' },
  'team.refreshTeam': { en: 'Refresh team', he: 'רענן צוות' },
  'team.leaveTeam': { en: 'Leave Team', he: 'עזוב צוות' },

  // Create team screen
  'createTeam.title': { en: 'Create Team', he: 'צור צוות' },
  'createTeam.teamName': { en: 'Team Name', he: 'שם צוות' },
  'createTeam.create': { en: 'Create', he: 'צור' },
  'createTeam.creating': { en: 'Creating...', he: 'יוצר...' },

  // Join team screen
  'joinTeam.title': { en: 'Join Team', he: 'הצטרף לצוות' },
  'joinTeam.inviteCode': { en: 'Invite Code', he: 'קוד הזמנה' },
  'joinTeam.join': { en: 'Join', he: 'הצטרף' },
  'joinTeam.joining': { en: 'Joining...', he: 'מצטרף...' },

  // History screen
  'history.title': { en: 'Incident History', he: 'היסטוריית אירועים' },
  'history.noIncidents': { en: 'No incidents yet', he: 'עדיין אין אירועים' },
  'history.incident': { en: 'Incident', he: 'אירוע' },

  // Metrics screen
  'metrics.title': { en: 'Metrics', he: 'מדדים' },
  'metrics.totalIncidents': { en: 'Total Incidents', he: 'סה"כ אירועים' },
  'metrics.avgResponseTime': { en: 'Avg Response Time', he: 'זמן תגובה ממוצע' },
  'metrics.incidentsTriggered': { en: 'Incidents triggered', he: 'אירועים שהופעלו' },
  'metrics.statusSubmissions': { en: 'Status submissions', he: 'דיווחי סטטוס' },
  'metrics.remindersSent': { en: 'Reminders sent', he: 'תזכורות שנשלחו' },
  'metrics.pushAttempts': { en: 'Push attempts', he: 'ניסיונות התראה' },
  'metrics.closedAuto': { en: 'Closed auto', he: 'נסגר אוטומטית' },
  'metrics.closedManual': { en: 'Closed manual', he: 'נסגר ידנית' },

  // Profile screen
  'profile.title': { en: 'Profile', he: 'פרופיל' },
  'profile.name': { en: 'Name', he: 'שם' },
  'profile.phone': { en: 'Phone', he: 'טלפון' },
  'profile.email': { en: 'Email', he: 'אימייל' },
  'profile.language': { en: 'Language', he: 'שפה' },
  'profile.english': { en: 'English', he: 'אנגלית' },
  'profile.hebrew': { en: 'Hebrew', he: 'עברית' },
  'profile.changeLanguage': { en: 'Change language', he: 'שנה שפה' },
  'profile.languageUpdated': { en: 'Language updated to {lang}.', he: 'השפה עודכנה ל-{lang}.' },
  'profile.directionHint': { en: 'If direction looks wrong, fully close and reopen the app.', he: 'אם כיוון התצוגה נראה שגוי, סגור ופתח מחדש את האפליקציה.' },
  'profile.restartRequired': { en: 'App restart required to change language direction', he: 'נדרש להפעיל מחדש את האפליקציה לשינוי כיוון השפה' },
  'profile.restart': { en: 'Restart Now', he: 'הפעל מחדש כעת' },

  // Profile setup screen
  'profileSetup.title': { en: 'Complete Your Profile', he: 'השלם את הפרופיל שלך' },
  'profileSetup.enterName': { en: 'Enter your name', he: 'הכנס את שמך' },
  'profileSetup.continue': { en: 'Continue', he: 'המשך' },

  // Incident screen
  'incident.title': { en: 'Incident', he: 'אירוע' },
  'incident.details': { en: 'Incident Details', he: 'פרטי אירוע' },
  'incident.status': { en: 'Status', he: 'סטטוס' },
  'incident.green': { en: 'Green', he: 'בסדר' },
  'incident.notGreen': { en: 'Not Green', he: 'לא בסדר' },
  'incident.noResponse': { en: 'No Response', he: 'לא הגיב' },

  // Common
  'common.loading': { en: 'Loading...', he: 'טוען...' },
  'common.back': { en: 'Back', he: 'חזרה' },
  'common.refreshNow': { en: 'Refresh now', he: 'רענן עכשיו' },
  'common.error': { en: 'Error', he: 'שגיאה' },
  'common.success': { en: 'Success', he: 'הצלחה' },
  'common.cancel': { en: 'Cancel', he: 'ביטול' },
  'common.save': { en: 'Save', he: 'שמור' },
  'common.delete': { en: 'Delete', he: 'מחק' },
  'common.confirm': { en: 'Confirm', he: 'אשר' },
} as const;

export type StringKey = keyof typeof strings;
