/**
 * Global I18n object + t() helper.
 *
 * English (en) is the fallback/reference language - bundled inline below so
 * first render never flashes raw keys even if the fetch for a non-fallback
 * language is slow or fails. Swedish (sv) and any future language are
 * fetched from frontend/i18n/{lang}.json (same origin, no CORS).
 *
 * Adding a language: copy frontend/i18n/en.json -> xx.json, translate the
 * values, and add 'xx' to I18n.SUPPORTED below. See frontend/i18n/README.md.
 */
const EN_INLINE = {
  "common": {
    "save": "Save",
    "saveChanges": "Save changes",
    "saving": "Saving…",
    "cancel": "Cancel",
    "delete": "Delete",
    "confirm": "Confirm",
    "close": "Close",
    "back": "Back",
    "edit": "Edit",
    "add": "Add",
    "remove": "Remove",
    "loading": "Loading…",
    "email": "Email",
    "password": "Password",
    "name": "Name",
    "phone": "Phone",
    "optional": "(optional)",
    "gracePeriod": {
      "h1": "1 hour",
      "h4": "4 hours",
      "h12": "12 hours",
      "h24": "24 hours",
      "h48": "48 hours"
    }
  },
  "errors": {
    "AUTH_REQUIRED": "You must log in again.",
    "AUTH_INVALID": "Incorrect email or password.",
    "ACCESS_DENIED": "You don't have access to this.",
    "VALIDATION_ERROR": "Check the highlighted fields.",
    "INVALID_EMAIL": "Invalid email address.",
    "INVALID_PHONE": "Invalid phone number.",
    "ACCOUNT_REQUIRED": "An account is required for this.",
    "PASSWORD_WEAK": "Password is too weak.",
    "EMAIL_NOT_VERIFIED": "Please verify your email address first.",
    "VERIFICATION_INVALID": "The verification link is invalid.",
    "VERIFICATION_EXPIRED": "The verification link has expired.",
    "PASSWORD_RESET_INVALID": "This password reset link is invalid or has already been used.",
    "PASSWORD_RESET_EXPIRED": "This password reset link has expired.",
    "NOT_FOUND": "Not found.",
    "RESOURCE_CONFLICT": "This already exists.",
    "MMSI_ALREADY_ACTIVE": "There is already an active trip for this vessel.",
    "INVALID_ETA": "Invalid arrival time.",
    "NOTIFICATION_FAILED": "Failed to send the notification.",
    "DEPARTURE_EDIT_LOCKED": "The departure time can only be changed before the trip is activated.",
    "ARRIVAL_EDIT_LOCKED": "The arrival time can only be changed before the trip is confirmed completed.",
    "GRACE_PERIOD_EDIT_LOCKED": "The grace period can only be changed before the trip is confirmed completed.",
    "ICE_CONTACT_REQUIRED": "An ICE contact must be assigned to this trip before it can be activated.",
    "CONTACT_RATE_LIMITED": "You've reached the daily limit for contact form submissions. Please try again tomorrow.",
    "CONTACT_TOO_MANY_FILES": "Too many attachments.",
    "CONTACT_FILE_TOO_LARGE": "One of your attachments is too large.",
    "CONTACT_INVALID_FILE_TYPE": "One of your attachments has an unsupported file type.",
    "CONTACT_ATTACHMENT_NOT_FOUND": "Attachment not found.",
    "CREW_GDPR_TOKEN_INVALID": "This link is invalid.",
    "CREW_GDPR_TOKEN_EXPIRED": "This link has expired. Please request a new one.",
    "SERVER_ERROR": "An unexpected error occurred.",
    "DATABASE_ERROR": "A database error occurred.",
    "RATE_LIMITED": "Too many attempts. Try again later.",
    "NETWORK_ERROR": "Could not reach the server. Check your connection.",
    "PARSE_ERROR": "Invalid response from the server.",
    "UNKNOWN": "An unexpected error occurred."
  },
  "validation": {
    "emailRequired": "Email is required",
    "emailInvalid": "Invalid email address",
    "passwordRequired": "Password is required",
    "passwordTooShort": "Password must be at least 8 characters",
    "passwordNeedsUppercase": "Password must contain at least one uppercase letter",
    "passwordNeedsNumber": "Password must contain at least one number",
    "nameRequired": "Name is required",
    "nameTooShort": "Name must be at least 2 characters",
    "phoneRequired": "Phone number is required",
    "phoneInvalid": "Invalid phone number (use international format, e.g. +46701234567)",
    "windyUrlRequired": "Windy link is required",
    "windyUrlInvalid": "Invalid Windy link. Must be from windy.com/route-planner",
    "messageRequired": "Message is required",
    "tooManyFiles": "Too many attachments (max {max})",
    "fileTooLarge": "{name} is too large (max {maxMb}MB)",
    "invalidFileType": "{name} has an unsupported file type (images and PDF only)",
    "vesselYearInvalid": "Model year must be a whole number between 1900 and {maxYear}",
    "vesselDimensionInvalid": "{label} must be a positive number in metres (max 200)"
  },
  "trip": {
    "status": {
      "all": "All",
      "draft": "Draft",
      "published": "Published",
      "active": "Active",
      "completed": "Completed",
      "cancelled": "Cancelled"
    }
  },
  "app": {
    "brand": "Yachting Earth",
    "nav": {
      "myTrips": "My trips",
      "myVessels": "My vessels",
      "savedRoutes": "Saved routes",
      "iceContacts": "ICE contacts",
      "crewAddressBook": "Address book",
      "myIceAccount": "My ICE account",
      "admin": "Admin",
      "logout": "Log out",
      "blog": "Blog",
      "faq": "FAQ"
    },
    "toggleNav": "Toggle navigation menu",
    "profileBadgeTitle": "{name} - My page",
    "lightboxClose": "Close full-size image",
    "renderError": "Something went wrong showing this page. Try reloading."
  },
  "dashboard": {
    "title": "My trips",
    "subtitle": "Overview of all your planned and ongoing trips",
    "newTrip": "+ New trip",
    "loadingTrips": "Loading trips…",
    "loadFailed": "Could not fetch trips.",
    "emptyTitle": "No trips yet",
    "emptyBody": "Create your first trip to get started.",
    "verifyEmailBanner": "Confirm your email address (<strong>{email}</strong>) to be able to create trips and add vessels. Check your inbox for the link.",
    "resendLink": "Resend the link",
    "resending": "Sending…",
    "alreadyVerified": "Your email address is already confirmed.",
    "verificationResent": "A new verification link has been sent.",
    "verificationResendFailed": "Could not send the link right now. Try again later.",
    "noIceContact": "You don't have an ICE contact yet — without one, no one can be alerted if your trip isn't confirmed in time.",
    "addIceContact": "Add an ICE contact",
    "vesselFallback": "Vessel #{id}",
    "departure": "Departure: {datetime}",
    "arrival": "Arrival: {datetime}",
    "grace": "Grace period: {label}",
    "graceHours": "{hours} h",
    "iceNotified": "⚠ ICE contact notified",
    "view": "View",
    "role": {
      "crew": "Crew",
      "ice": "ICE contact"
    },
    "readOnly": "Read-only"
  },
  "login": {
    "tagline": "Safe voyage, safe return",
    "emailLabel": "Email",
    "passwordLabel": "Password",
    "submit": "Log in",
    "submitting": "Logging in…",
    "noAccount": "No account?",
    "registerLink": "Register",
    "errorDefault": "Login failed.",
    "forgotPasswordLink": "Forgot password?",
    "crewGdprLink": "Invited as crew without an account? Manage your data here.",
    "redirectNotice": {
      "default": "Please log in to continue.",
      "contact": "Please log in to use the contact form."
    },
    "tabs": {
      "user": "Log in",
      "sar": "SAR access"
    }
  },
  "register": {
    "tagline": "Create account",
    "nameLabel": "Name",
    "emailLabel": "Email",
    "phoneLabel": "Phone (optional)",
    "phonePlaceholder": "+46701234567",
    "passwordLabel": "Password",
    "passwordHint": "At least 8 characters, one uppercase letter and one number.",
    "confirmPasswordLabel": "Confirm password",
    "submit": "Create account",
    "submitting": "Creating account…",
    "haveAccount": "Already have an account?",
    "loginLink": "Log in",
    "passwordMismatch": "Passwords don't match",
    "acceptTerms": "I accept the {termsLink} and {privacyLink}",
    "termsLink": "Terms of Service",
    "privacyLink": "Privacy Policy",
    "acceptTermsRequired": "You must accept the Terms of Service and Privacy Policy",
    "errorDefault": "Could not create the account."
  },
  "forgotPassword": {
    "tagline": "Reset your password",
    "emailLabel": "Email",
    "submit": "Send reset link",
    "submitting": "Sending…",
    "sent": "If that email address is registered, we've sent a link to reset your password. Check your inbox.",
    "backToLogin": "Back to login"
  },
  "resetPassword": {
    "tagline": "Choose a new password",
    "noToken": "No reset link found. Check that you clicked the whole link.",
    "requestNew": "Request a new link",
    "passwordLabel": "New password",
    "confirmPasswordLabel": "Confirm new password",
    "submit": "Reset password",
    "submitting": "Resetting…",
    "passwordMismatch": "Passwords don't match",
    "linkExpired": "This link has expired. Please request a new one.",
    "errorDefault": "Could not reset the password.",
    "successTitle": "Password reset",
    "successBody": "Your password has been changed. You've been signed out everywhere and can now log in with your new password."
  },
  "crewGdprRequest": {
    "tagline": "Manage your crew data",
    "intro": "If you were invited as crew (or added as an ICE contact) without creating an account, enter the email address the invitation was sent to. We'll send you a secure, time-limited link to a portal where you can view, export or delete your data, or send us a message.",
    "emailLabel": "Email",
    "submit": "Send access link",
    "submitting": "Sending…",
    "sent": "If that email address matches a crew or ICE-contact record, we've sent a secure access link. Check your inbox.",
    "backToLogin": "Back to login"
  },
  "crewGdprPortal": {
    "noToken": "No access link found. Check that you clicked the whole link.",
    "requestNew": "Request a new link",
    "loading": "Loading…",
    "invalidLink": "This link is invalid.",
    "linkExpired": "This link has expired. Please request a new one.",
    "title": "Your crew data",
    "intro": "Showing data linked to {email}.",
    "membershipsTitle": "Trips you were invited to",
    "withSkipper": "with {skipper}",
    "tripStatus": {
      "draft": "not yet published",
      "published": "upcoming",
      "active": "in progress",
      "completed": "completed",
      "cancelled": "cancelled"
    },
    "noMemberships": "No crew memberships found for this email address.",
    "notErasableActive": "This trip hasn't finished yet, so this membership can't be deleted immediately - crew details are still needed for safety purposes while a trip is in progress. It will be deleted automatically 30 days after the trip ends.",
    "iceContactNote": "This email address is also registered as an emergency (ICE) contact for {count} skipper(s). That data is included in the export below; to have it removed, ask the skipper to delete you from their ICE contacts.",
    "exportTitle": "Export my data",
    "exportHint": "Download everything we hold about this email address as a JSON file.",
    "exportButton": "Download my data",
    "eraseTitle": "Forget me",
    "eraseHint": "Immediately delete your crew membership on any trip that has already finished, instead of waiting for the automatic 30-day deletion. Memberships on a trip that hasn't finished yet are kept until it does, for safety reasons.",
    "eraseButton": "Delete my data now",
    "eraseConfirm": "This will permanently delete your crew data for every finished trip. This cannot be undone. Continue?",
    "erasing": "Deleting…",
    "eraseSuccess": "Deleted {count} crew membership(s).",
    "eraseKeptActive": "{count} membership(s) on a trip that hasn't finished yet were kept and will be deleted automatically once it has.",
    "eraseFailed": "Could not delete your data.",
    "contactTitle": "Send us a message",
    "contactHint": "Have a question about your data, or something else to tell us? This goes directly to the system owner.",
    "messageLabel": "Message",
    "contactSubmit": "Send message",
    "contactSubmitting": "Sending…",
    "contactSuccess": "Your message has been sent.",
    "contactFailed": "Could not send your message."
  },
  "verifyEmail": {
    "noToken": "No verification link found. Check that you clicked the whole link.",
    "backToStart": "Back to start",
    "confirming": "Confirming your email address…",
    "failedTitle": "Verification failed",
    "emailTaken": "The new email address is already in use by another account.",
    "linkInvalid": "The link is invalid or has expired.",
    "toOverview": "To your overview",
    "toLogin": "To login",
    "changedTitle": "Email address updated",
    "confirmedTitle": "Email address confirmed",
    "changedBody": "Your email address has been changed to <strong>{email}</strong>.",
    "confirmedBody": "Thank you! Your account is now confirmed and you have full access to Yachting Earth."
  },
  "profile": {
    "title": "My page",
    "subtitle": "View and manage your account details",
    "photoHeading": "Photo",
    "photoChangeLabel": "Change photo (optional)",
    "photoHint": "Used by search and rescue to identify you as skipper. JPEG/PNG, max 10 MB.",
    "photoSubmit": "Save photo",
    "photoSaving": "Saving…",
    "photoChooseFirst": "Choose an image first.",
    "photoSaveFailed": "Could not save the photo.",
    "photoSaved": "The photo has been saved.",
    "detailsHeading": "My details",
    "loadingDetails": "Loading your details…",
    "loadFailed": "Could not fetch your details.",
    "nameLabel": "Name",
    "phoneLabel": "Phone",
    "emailLabel": "Email",
    "languageLabel": "Language",
    "submit": "Save changes",
    "saveFailed": "Could not save the changes.",
    "emailChangePending": "A confirmation link has been sent to <strong>{email}</strong>. Your email address only changes once you click the link. We've also notified your current address.",
    "saved": "Your details have been updated.",
    "gdprHeading": "Download my data",
    "gdprHint": "Request a summary of everything we've stored about you - account, vessels, ICE contacts and trips. The file is available for download for 7 days, or until you download it.",
    "gdprChecking": "Checking status…",
    "gdprRequestButton": "Request my data",
    "gdprAvailableUntil": "Your summary is ready and can be downloaded until {date}.",
    "gdprDownloadButton": "Download my data",
    "gdprRequestAgainButton": "Request again",
    "gdprRequestFailed": "Could not compile your data.",
    "gdprRequestReady": "Your data is ready to download.",
    "gdprDownloadFailed": "Could not download your data.",
    "gdprDownloaded": "Your data has been downloaded.",
    "deleteHeading": "Delete account",
    "deleteWarning": "Deleting your account permanently removes your vessels and ICE contacts, and ends your trips. This cannot be undone.",
    "deleteButton": "Delete my account",
    "deletePasswordLabel": "Confirm with your password",
    "deleteConfirmButton": "Delete permanently",
    "deleteCancelButton": "Cancel",
    "passwordRequired": "Enter your password to confirm.",
    "deleteFailed": "Could not delete the account.",
    "deleted": "Your account has been deleted."
  },
  "createTrip": {
    "title": "Create new trip",
    "submit": "Create trip",
    "submitting": "Creating trip…",
    "scheduleConflictNotice": "Note: another trip with the same MMSI number is already scheduled during an overlapping time period.",
    "created": "Trip created",
    "vessel": {
      "heading": "Vessel",
      "loading": "Loading vessels…",
      "selectLabel": "Select vessel",
      "mmsiSuffix": " (MMSI {mmsi})",
      "noneRegistered": "You don't have any registered vessels yet. Add one below.",
      "addNew": "+ Add new vessel",
      "nameLabel": "Vessel name",
      "namePlaceholder": "e.g. Thrym",
      "mmsiLabel": "MMSI (optional)",
      "callSignLabel": "Call sign (optional)",
      "modelLabel": "Model (optional)",
      "modelPlaceholder": "e.g. Bavaria 34",
      "yearLabel": "Model year (optional)",
      "yearPlaceholder": "e.g. 2011",
      "lengthLabel": "Length, metres (optional)",
      "widthLabel": "Width, metres (optional)",
      "draftLabel": "Draft, metres (optional)",
      "notesLabel": "Notes (optional)",
      "notesPlaceholder": "Other information about the vessel",
      "photoLabel": "Vessel photo (optional)",
      "photoHint": "Used by search and rescue to identify the vessel. JPEG/PNG, max 10 MB.",
      "saveButton": "Save vessel",
      "saveFailed": "Could not save the vessel.",
      "mmsiAlreadyRegistered": "This MMSI number is already registered in the system.",
      "photoUploadFailed": "The vessel was saved, but the photo could not be uploaded ({error})",
      "unknownError": "unknown error",
      "added": "Vessel added",
      "length": "Length",
      "width": "Width",
      "draft": "Draft"
    },
    "iceContact": {
      "heading": "ICE contact",
      "loading": "Loading ICE contacts…",
      "selectLabel": "Who should be alerted if this trip isn't confirmed in time?",
      "selectHint": "Pick the single ICE contact to alert for this trip. You can skip this for now, but the trip can't be activated until one is set.",
      "required": "Please choose an ICE contact for this trip.",
      "noneRegistered": "You don't have any registered ICE contacts yet.",
      "addLink": "Add an ICE contact"
    },
    "schedule": {
      "heading": "Schedule",
      "departureLabel": "Departure (UTC)",
      "arrivalLabel": "Planned arrival (UTC)",
      "gracePeriodLabel": "Grace period before the ICE contact is alerted",
      "gracePeriodHint": "Time after the planned arrival before the ICE contact is notified if you haven't verified your arrival."
    },
    "routes": {
      "heading": "Routes",
      "addAlternative": "+ Add alternative route",
      "addSavedRoute": "+ Add saved route",
      "primary": "Primary route",
      "alternative": "Alternative route {index}",
      "moveUp": "Move up",
      "moveDown": "Move down",
      "modeWindy": "Import from Windy",
      "modeManual": "Draw manually",
      "modeGpx": "Import GPX file",
      "drawLabel": "Draw the route on the map",
      "drawHint": "Click the map to add points. Drag a point to move it, click a point and choose \"Remove point\" to delete it.",
      "points": "points",
      "clear": "Clear route",
      "windyUrlLabel": "Windy link",
      "windyUrlPlaceholder": "https://www.windy.com/route-planner/boat/...",
      "gpxLabel": "GPX file",
      "gpxHint": "Upload a .gpx file exported from your chartplotter or navigation app. The route is read immediately and the file itself is not kept.",
      "reasonLabel": "Reason",
      "reasonPlaceholder": "e.g. If the wind turns northerly",
      "saveToArchive": "Save to route archive",
      "saveRouteNamePlaceholder": "Name this route, e.g. Marstrand-Skagen",
      "saveRouteNameRequired": "Enter a name for the route.",
      "saveRouteFailed": "Could not save the route.",
      "saveRouteSuccess": "Route saved."
    },
    "errors": {
      "vesselRequired": "Select or add a vessel.",
      "datesRequired": "Enter both departure and arrival times.",
      "arrivalBeforeDeparture": "The arrival time must be after the departure time.",
      "primaryRouteMinPoints": "Draw at least two points for the primary route.",
      "gpxParseError": "Could not read a route from that GPX file. Make sure it contains a route or track with at least two points.",
      "createFailed": "Could not create the trip."
    }
  },
  "crewInvite": {
    "noToken": "No invitation link found. Check that you clicked the whole link.",
    "loading": "Loading invitation...",
    "invalidInvite": "The invitation is invalid or has expired.",
    "backToStart": "Back to start",
    "accountSection": {
      "loggedIn": "You are logged in as <strong>{name}</strong> - the invitation will be linked to your account.",
      "saveAccountLabel": "Save my account so I can log in later{emailSuffix}",
      "passwordHint": "At least 8 characters, one uppercase letter and one number.",
      "confirmPasswordLabel": "Confirm password",
      "acceptTerms": "I accept the {termsLink} and {privacyLink}",
      "termsLink": "Terms of Service",
      "privacyLink": "Privacy Policy",
      "haveAccount": "Already have an account? {loginLink} and open the link again so the invitation gets linked to your account."
    },
    "loginLink": "Log in",
    "title": "You're invited on a trip!",
    "summary": {
      "skipper": "Skipper",
      "vessel": "Vessel",
      "departure": "Departure",
      "arrival": "Arrival",
      "crewCount": "Crew so far",
      "crewCountValue": "{count} people"
    },
    "nameLabel": "Your name",
    "phoneLabel": "Phone number (optional)",
    "phonePlaceholder": "+46701234567",
    "iceContactLabel": "Your emergency contact",
    "iceContactPlaceholder": "e.g. Erik (husband) +46701234568",
    "iceContactHint": "Name and phone number of someone who should be contacted if something happens.",
    "medicalLabel": "Medical information for search and rescue (optional)",
    "medicalPlaceholder": "e.g. allergies, medications, blood type, medical conditions",
    "medicalHint": "Only shown to search and rescue authorities in an emergency - never to the skipper or the ICE contact.",
    "sharing": {
      "heading": "Sharing",
      "contactHint": "Your phone and email are only shown to the skipper by default. Choose whether to share them with the ICE contact too.",
      "shareContactWithIce": "Share my phone and email with the ICE (In Case of Emergency) contact",
      "emergencyHint": "Your emergency contact above is only shown to the skipper by default.",
      "shareEmergencyWithIce": "Share my emergency contact with the ICE contact"
    },
    "photoLabel": "Photo of you (optional but recommended)",
    "photoHint": "Used by search and rescue to identify the crew. JPEG/PNG, max 10 MB.",
    "submit": "Accept & join",
    "submitting": "Joining...",
    "passwordMismatch": "Passwords don't match",
    "acceptTermsRequired": "You must accept the Terms of Service and Privacy Policy",
    "photoUploadFailed": "However, the photo could not be uploaded ({reason}).",
    "unknownError": "unknown error",
    "acceptFailed": "Could not join the trip.",
    "acceptSuccess": "You are now part of the crew. Have a pleasant and safe trip!",
    "toOverview": "To your overview",
    "crewViewLinkHint": "Save this link - it lets you view the trip and change what you share at any time.",
    "crewViewLinkOpen": "Open trip view",
    "crewViewLinkCopy": "Copy link",
    "crewViewLinkCopied": "Link copied"
  },
  "iceConfirm": {
    "noToken": "No confirmation link found. Check that you clicked the whole link.",
    "loading": "Loading...",
    "invalidLink": "The link is invalid or has already been used.",
    "backToStart": "Back to start",
    "accountSection": {
      "loggedIn": "You are logged in as <strong>{name}</strong> - the confirmation will be linked to your account.",
      "passwordHint": "At least 8 characters, one uppercase letter and one number.",
      "confirmPasswordLabel": "Confirm password",
      "deleteAfterTripLabel": "Automatically delete my account and my data once the trip(s) I'm an ICE contact for have ended",
      "retentionNote": "By default we keep your account permanently so you can log in again for future trips and update your details. Check the box above if you'd instead like the account and your data to be deleted automatically some time after the trip is over.",
      "acceptTerms": "I accept the {termsLink} and {privacyLink}",
      "termsLink": "Terms of Service",
      "privacyLink": "Privacy Policy",
      "haveAccount": "Already have an account? {loginLink} and open the link again so the confirmation gets linked to your account."
    },
    "loginLink": "Log in",
    "title": "Confirm as ICE contact",
    "intro": "{skipper} has added you as their ICE contact (In Case of Emergency){relationshipSuffix}. This means you may be contacted if they don't check in from a voyage in time.",
    "passwordMismatch": "Passwords don't match",
    "acceptTermsRequired": "You must accept the Terms of Service and Privacy Policy",
    "confirming": "Confirming...",
    "accountConflict": "You already have an account with this email address. Log in and open the link again to confirm.",
    "confirmFailed": "Could not confirm.",
    "policyNoteDelete": "Your account and your data will be automatically deleted once the trip(s) you're an ICE contact for have ended.",
    "policyNoteKeep": "Your account is kept permanently so you can log in again for future trips and update your details.",
    "confirmSuccess": "Thank you! You are now confirmed as an ICE contact.",
    "toOverview": "To your overview"
  },
  "iceContacts": {
    "title": "ICE contacts",
    "subtitle": "Your ICE (In Case of Emergency) contacts, who are alerted if a trip isn't confirmed in time",
    "addTitle": "Add contact",
    "cancelEdit": "Cancel edit",
    "relationshipLabel": "Relationship",
    "relationshipPlaceholder": "e.g. spouse, brother, friend",
    "phonePlaceholder": "+46701234567",
    "channelLabel": "Preferred notification channel",
    "channelLabels": {
      "email": "Email",
      "telegram": "Telegram",
      "whatsapp": "WhatsApp"
    },
    "channelHint": "Alerts are sent to the contact via this channel when a trip isn't confirmed in time.",
    "submitAdd": "Save contact",
    "loadingContacts": "Loading contacts...",
    "loadFailed": "Could not fetch contacts.",
    "emptyTitle": "No ICE contacts yet",
    "emptyBody": "Without an ICE contact, the system can't alert anyone if your trip isn't confirmed in time. Add at least one contact above.",
    "confirmed": "✓ Confirmed",
    "pending": "⏳ Awaiting confirmation",
    "copyConfirmLink": "Copy confirmation link",
    "editButton": "Edit",
    "linkCopied": "Link copied",
    "editTitle": "Edit: {name}",
    "relationshipRequired": "Relationship is required",
    "relationshipTooLong": "Relationship: max 50 characters",
    "saveFailed": "Could not save the contact.",
    "addedEmailSent": "Contact added. A confirmation email has been sent.",
    "addedEmailFailed": "Contact added. Sending the email failed - share the link manually:",
    "updated": "Contact updated.",
    "deleteConfirm": "Remove the ICE contact {name}?",
    "deleteFailed": "Could not remove the contact.",
    "deleted": "Contact removed."
  },
  "iceAccount": {
    "title": "My ICE account",
    "subtitle": "Skippers you're an ICE (In Case of Emergency) contact for, and your own details",
    "deletePolicyHeading": "Delete account after the trip",
    "deletePolicyLabel": "Automatically delete my account and my details once the trip(s) I'm an ICE contact for have ended",
    "deletePolicyHint": "By default your account is kept permanently. Check the box if you'd rather have it deleted automatically some time after you're no longer an ICE contact for any active trip.",
    "loading": "Loading...",
    "policySaveFailed": "Could not save the setting.",
    "policyEnabled": "Your account will now be automatically deleted once the trip(s) have ended.",
    "policyDisabled": "Your account will be kept permanently.",
    "loadContactsFailed": "Could not fetch your connections.",
    "emptyTitle": "No connections yet",
    "emptyBody": "You're not confirmed as an ICE contact for any skipper with this account.",
    "editMyDetails": "Edit my details",
    "phonePlaceholder": "+46701234567",
    "channelLabel": "Preferred notification channel",
    "channelLabels": {
      "email": "Email",
      "telegram": "Telegram",
      "whatsapp": "WhatsApp"
    },
    "saveFailed": "Could not save the changes.",
    "updated": "Your details have been updated."
  },
  "icePortal": {
    "invalidLink": "Invalid link - trip or access code is missing. Use the link from the notification message.",
    "loadingTrip": "Loading trip…",
    "loadFailed": "Could not fetch the trip. The link may be invalid or revoked.",
    "title": "Trip information",
    "readOnlyNotice": "Read-only view for ICE contact and search and rescue (SAR)",
    "alertTriggered": "<strong>Alert triggered - arrival not confirmed in time</strong>",
    "printButton": "Print / save as PDF",
    "expandImagesButton": "Expand all images",
    "collapseImagesButton": "Collapse all images",
    "sarAccess": {
      "heading": "Credentials for search and rescue (SAR)",
      "description": "If a SAR authority needs read-only access to this trip, give them this reference and PIN to enter on the SAR lookup page.",
      "referenceLabel": "Reference",
      "pinLabel": "PIN",
      "showPin": "Show PIN",
      "hidePin": "Hide PIN"
    },
    "skipper": {
      "heading": "Skipper"
    },
    "trip": {
      "heading": "Trip",
      "plannedDeparture": "Planned departure: <strong>{datetime}</strong>",
      "plannedArrival": "Planned arrival: <strong>{datetime}</strong>"
    },
    "vessel": {
      "nameLine": "Vessel: {name}",
      "modelLabel": "Model {value}",
      "yearBuilt": "Model year {year}",
      "mmsi": "MMSI {value}",
      "callSign": "Call sign {value}",
      "dimLength": "L {value} m",
      "dimWidth": "B {value} m",
      "dimDraft": "D {value} m"
    },
    "routes": {
      "heading": "Routes",
      "empty": "No routes registered.",
      "primary": "Primary route",
      "alternate": "Alternate route {order}",
      "mapLabel": "Route {order}",
      "noMap": "No route to display",
      "downloadGpx": "Download GPX"
    },
    "crew": {
      "heading": "Crew aboard",
      "empty": "No confirmed crew registered.",
      "unknownName": "Unknown",
      "ownIceContact": "Own emergency contact: {contact}",
      "medicalLabel": "Medical info"
    },
    "iceContact": {
      "heading": "Skipper's emergency contact (ICE)",
      "empty": "No emergency contact registered.",
      "relationshipLabel": "Relationship"
    },
    "log": {
      "heading": "Change log",
      "empty": "No changes logged.",
      "ip": "IP: {ip}"
    }
  },
  "crewView": {
    "invalidLink": "Invalid link - trip or access code is missing. Use the link from your crew invitation email.",
    "loadingTrip": "Loading trip…",
    "loadFailed": "Could not fetch the trip. The link may be invalid or revoked.",
    "title": "Trip information",
    "skipper": {
      "heading": "Skipper"
    },
    "trip": {
      "heading": "Trip",
      "plannedDeparture": "Planned departure: <strong>{datetime}</strong>",
      "plannedArrival": "Planned arrival: <strong>{datetime}</strong>"
    },
    "vessel": {
      "nameLine": "Vessel: {name}",
      "modelLabel": "Model {value}",
      "yearBuilt": "Model year {year}",
      "mmsi": "MMSI {value}",
      "callSign": "Call sign {value}",
      "dimLength": "L {value} m",
      "dimWidth": "B {value} m",
      "dimDraft": "D {value} m"
    },
    "routes": {
      "heading": "Routes",
      "empty": "No routes registered.",
      "primary": "Primary route",
      "alternate": "Alternate route {order}",
      "mapLabel": "Route {order}",
      "noMap": "No route to display"
    },
    "crew": {
      "heading": "Crew aboard",
      "empty": "No confirmed crew registered.",
      "unknownName": "Unknown",
      "you": "you",
      "ownIceContact": "Own emergency contact: {contact}"
    },
    "sharingSettings": {
      "heading": "Sharing",
      "hint": "Choose what of your own contact details is shared with the ICE (In Case of Emergency) contact.",
      "shareContactWithIce": "Share my phone and email with the ICE contact",
      "shareEmergencyWithIce": "Share my emergency contact with the ICE contact",
      "saveButton": "Save",
      "saved": "Your sharing settings have been saved.",
      "saveFailed": "Could not save your sharing settings."
    },
    "medical": {
      "heading": "Your information for search and rescue",
      "hint": "Medical information that may be useful in an emergency - illnesses, allergies, blood type, medications. Only shown to search and rescue authorities, never to the skipper or the ICE contact.",
      "placeholder": "e.g. allergies, medications, blood type, medical conditions",
      "empty": "You haven't added any information.",
      "readOnlyNote": "Log in with an account to change this.",
      "saveButton": "Save",
      "saved": "Your information has been saved.",
      "saveFailed": "Could not save your information."
    },
    "log": {
      "heading": "Change log",
      "empty": "No changes logged."
    }
  },
  "sar": {
    "tagline": "Search and rescue (SAR) access",
    "instructions": "Enter the reference and PIN code you received from the person in distress's contact for read-only access to the trip's crew list, routes and change log.",
    "referenceLabel": "Reference",
    "referencePlaceholder": "YE-XXXXXX",
    "pinLabel": "PIN code",
    "pinPlaceholder": "6 digits",
    "submit": "Show trip",
    "missingFields": "Enter both the reference and PIN code.",
    "checking": "Checking…",
    "invalidCredentials": "Incorrect reference or PIN code. Check the details and try again."
  },
  "blog": {
    "title": "Blog",
    "subtitle": "News and articles from Yachting Earth",
    "loading": "Loading posts…",
    "loadFailed": "Could not fetch the blog posts.",
    "emptyTitle": "No posts yet",
    "emptyBody": "Check back soon for new articles.",
    "readMore": "Read more",
    "byAuthor": "Written by {author}",
    "backToList": "Back to blog",
    "notFound": "This post could not be found."
  },
  "vessels": {
    "title": "My vessels",
    "subtitle": "Vessels you can pick when creating a new trip",
    "loadingVessels": "Loading vessels...",
    "form": {
      "addTitle": "Add vessel",
      "editTitle": "Edit: {name}",
      "cancelEdit": "Cancel change",
      "nameLabel": "Vessel name",
      "namePlaceholder": "e.g. Thrym",
      "mmsiLabel": "MMSI (optional)",
      "callSignLabel": "Call sign (optional)",
      "modelLabel": "Model (optional)",
      "modelPlaceholder": "e.g. Bavaria 34",
      "yearLabel": "Model year (optional)",
      "yearPlaceholder": "e.g. 2011",
      "lengthLabel": "Length, metres (optional)",
      "widthLabel": "Width, metres (optional)",
      "draftLabel": "Draft, metres (optional)",
      "notesLabel": "Notes (optional)",
      "notesPlaceholder": "Other information about the vessel",
      "photoLabel": "Vessel photo (optional)",
      "photoHint": "Used by search and rescue to identify the vessel. JPEG/PNG, max 10 MB.",
      "submit": "Save vessel",
      "submitEdit": "Save changes"
    },
    "dimensions": {
      "length": "Length",
      "width": "Width",
      "draft": "Draft"
    },
    "loadFailed": "Could not fetch vessels.",
    "emptyTitle": "No vessels yet",
    "emptyBody": "Add a vessel above so you can pick it when creating a trip.",
    "card": {
      "yearBuilt": "Model year {year}",
      "mmsi": "MMSI {mmsi}",
      "callSign": "Call sign {callSign}",
      "editButton": "Edit"
    },
    "saveFailed": "Could not save the vessel.",
    "mmsiAlreadyRegistered": "This MMSI number is already registered in the system.",
    "photoUploadFailed": "The vessel was saved, but the photo could not be uploaded ({error})",
    "unknownError": "unknown error",
    "updated": "The vessel has been updated.",
    "added": "The vessel has been added.",
    "confirmDelete": "Remove the vessel {name}?",
    "deleteFailed": "Could not remove the vessel.",
    "deleted": "The vessel has been removed."
  },
  "savedRoutes": {
    "title": "Saved routes",
    "subtitle": "Routes you can reuse when creating a new trip",
    "loading": "Loading saved routes...",
    "loadFailed": "Could not fetch saved routes.",
    "emptyTitle": "No saved routes yet",
    "emptyBody": "Save a route while creating a trip so you can reuse it later.",
    "form": {
      "nameLabel": "Name",
      "windyUrlLabel": "Windy link"
    },
    "saveFailed": "Could not save the route.",
    "updated": "The route has been updated.",
    "confirmDelete": "Remove the saved route {name}?",
    "deleteFailed": "Could not remove the route.",
    "deleted": "The route has been removed."
  },
  "crewAddressBook": {
    "title": "Address book",
    "subtitle": "Contacts you've explicitly saved when inviting crew, so you can reuse them on future trips",
    "loading": "Loading saved contacts...",
    "loadFailed": "Could not fetch saved contacts.",
    "emptyTitle": "No saved contacts yet",
    "emptyBody": "Check \"Save contact\" when inviting crew to a trip so they show up here for reuse.",
    "form": {
      "nameLabel": "Name",
      "emailLabel": "Email"
    },
    "saveFailed": "Could not save the contact.",
    "updated": "The contact has been updated.",
    "confirmDelete": "Remove {name} from your address book?",
    "deleteFailed": "Could not remove the contact.",
    "deleted": "The contact has been removed."
  },
  "admin": {
    "title": "Admin",
    "subtitle": "System statistics and user management - click a tile to see details",
    "loadingStats": "Loading statistics...",
    "statsLoadFailed": "Could not fetch statistics.",
    "loadTabFailed": "Could not fetch {title}.",
    "yes": "Yes",
    "no": "No",
    "cannotDeleteSelf": "You can't delete your own account from here",
    "confirmDeleteUser": "Delete the user {name} ({email}) and all associated data? This cannot be undone.",
    "deleteUserFailed": "Could not delete the user.",
    "userDeleted": "The user has been deleted.",
    "stats": {
      "users": "Users",
      "routes": "Routes",
      "vessels": "Vessels",
      "iceContacts": "ICE contacts",
      "logs": "System logs"
    },
    "empty": {
      "users": "No users",
      "routes": "No routes",
      "vessels": "No vessels",
      "iceContacts": "No ICE contacts",
      "logs": "No logs match the filter"
    },
    "table": {
      "adminHeader": "Admin",
      "created": "Created",
      "skipper": "Skipper",
      "departure": "Departure",
      "arrival": "Arrival",
      "tripStatus": "Trip status",
      "order": "Order",
      "owner": "Owner",
      "mmsi": "MMSI",
      "callSign": "Call sign",
      "model": "Model",
      "relationship": "Relationship",
      "channel": "Channel",
      "confirmed": "Confirmed"
    },
    "logLevel": {
      "info": "Info",
      "warning": "Warning",
      "error": "Error"
    },
    "logCategory": {
      "cron": "Cron",
      "email": "Email",
      "notification": "Notification",
      "database": "Database",
      "api": "Backend/API",
      "auth": "Authentication",
      "trip": "Trip",
      "route": "Route",
      "vessel": "Vessel",
      "crew": "Crew",
      "ice": "ICE contact",
      "sar": "SAR",
      "user": "User",
      "admin": "Admin",
      "photo": "Photo"
    },
    "logs": {
      "searchLabel": "Search",
      "searchPlaceholder": "Search in message or ID...",
      "levelLabel": "Log level",
      "allLevels": "All levels",
      "categoryLabel": "Category",
      "allCategories": "All categories",
      "loadFailed": "Could not fetch logs.",
      "stackTrace": "Stack trace",
      "piiData": "PII data",
      "prevPage": "Previous",
      "nextPage": "Next",
      "pageInfo": "Page {page} of {totalPages} ({total} logs)",
      "table": {
        "time": "Time",
        "level": "Level",
        "category": "Category",
        "message": "Message",
        "user": "User"
      }
    }
  },
  "tripDetail": {
    "loading": "Loading trip…",
    "loadFailed": "Could not fetch the trip.",
    "backToDashboard": "Back to my trips",
    "unknownVessel": "Unknown vessel",
    "readOnlyBanner": {
      "crew": "You're viewing this trip as an invited crew member. It's read-only for you.",
      "ice": "You're viewing this trip as its ICE contact. It's read-only for you."
    },
    "header": {
      "meta": "Departure {departure} · Arrival {arrival} · Grace period {grace}",
      "iceNotified": "ICE contact notified"
    },
    "skipper": {
      "heading": "Skipper"
    },
    "schedule": {
      "heading": "Schedule",
      "departureLabel": "Departure (UTC)",
      "arrivalLabel": "Arrival (UTC)",
      "graceLabel": "Grace period",
      "changeButton": "Save",
      "departureLockedHint": "Departure can no longer be changed once the trip is activated.",
      "arrivalLockedHint": "Arrival can no longer be changed once the trip is confirmed completed.",
      "graceLockedHint": "Grace period can no longer be changed once the trip is confirmed completed.",
      "changeFailed": "Could not change the schedule.",
      "changed": "The schedule has been changed."
    },
    "vessel": {
      "heading": "Vessel",
      "modelLabel": "Model {model}",
      "yearBuilt": "Model year {year}",
      "mmsi": "MMSI {mmsi}",
      "callSign": "Call sign {callSign}",
      "dimLength": "L {value} m",
      "dimWidth": "B {value} m",
      "dimDraft": "D {value} m",
      "changeLabel": "Change vessel",
      "changeButton": "Change vessel",
      "changeFailed": "Could not change the vessel.",
      "mmsiConflictNotice": "Note: another trip with the same MMSI number is already scheduled during an overlapping time period.",
      "changed": "The vessel has been changed."
    },
    "iceContact": {
      "heading": "ICE contact",
      "allContacts": "All my ICE contacts are alerted for this trip.",
      "specificContact": "A specific ICE contact has been assigned for this trip.",
      "changeLabel": "Change ICE contact",
      "changeButton": "Save",
      "changeFailed": "Could not change the ICE contact.",
      "changed": "The ICE contact has been changed."
    },
    "routes": {
      "heading": "Routes",
      "addAltHeading": "Add alternative route",
      "importWindy": "Import from Windy",
      "drawManual": "Draw manually",
      "importGpx": "Import GPX file",
      "addSavedRoute": "+ Add saved route",
      "reasonOptionalLabel": "Reason (optional)",
      "reasonPlaceholder": "e.g. If the wind turns northerly",
      "saveToArchive": "Save to route archive",
      "saveRouteNamePlaceholder": "Name this route, e.g. Marstrand-Skagen",
      "saveRouteNameRequired": "Enter a name for the route.",
      "saveRouteArchiveFailed": "Could not save the route to your archive.",
      "saveRouteArchiveSuccess": "Route saved to your archive.",
      "addButton": "Add route",
      "empty": "No routes added yet.",
      "mainRoute": "Main route",
      "altRoute": "Alternative route {n}",
      "moveUpTitle": "Move up",
      "moveDownTitle": "Move down",
      "noRouteToShow": "No route to display",
      "drawOnMapLabel": "Draw route on the map",
      "drawHint": "Click the map to add points. Drag a point to move it, click a point and choose \"Remove point\" to delete it.",
      "pointsLabel": "points",
      "clearRoute": "Clear route",
      "windyUrlLabel": "Windy link",
      "gpxLabel": "GPX file",
      "gpxHint": "Upload a .gpx file exported from your chartplotter or navigation app. The route is read immediately and the file itself is not kept.",
      "gpxParseError": "Could not read a route from that GPX file. Make sure it contains a route or track with at least two points.",
      "reasonLabel": "Reason",
      "minPointsError": "Draw at least two points for the route.",
      "addFailed": "Could not add the route.",
      "added": "Route added",
      "saveFailed": "Could not save the route.",
      "saved": "The route has been saved",
      "deleteConfirm": "Remove this route?",
      "deleteFailed": "Could not remove the route.",
      "deleted": "The route has been removed",
      "reorderFailed": "Could not change the order."
    },
    "crew": {
      "heading": "Crew",
      "inviteHeading": "Invite crew member",
      "nameOptionalLabel": "Name (optional)",
      "addressBookAriaLabel": "Suggestions from your saved contacts",
      "saveContactLabel": "Save contact",
      "sendInviteButton": "Send invitation",
      "empty": "No crew invited yet.",
      "unknownName": "Unknown",
      "iceContactLabel": "Emergency contact: {contact}",
      "accepted": "✓ Accepted",
      "pending": "⏳ Pending",
      "changePhoto": "Change photo",
      "addPhoto": "Add photo",
      "copyLink": "Copy link",
      "choosePhotoFirst": "Choose an image first.",
      "photoSaveFailed": "Could not save the photo.",
      "photoSaved": "The photo has been saved.",
      "linkCopied": "Link copied",
      "inviteFailed": "Could not send the invitation.",
      "inviteCreatedEmailSent": "Invitation created and emailed to the crew member. You can also share the link manually:",
      "inviteCreatedNotice": "Invitation created, but the email could not be sent - share the link manually:",
      "removeConfirm": "Remove this crew member from the trip?",
      "removeFailed": "Could not remove the crew member",
      "removed": "Crew member removed"
    },
    "actions": {
      "heading": "Actions",
      "notActiveHint": "The trip isn't active yet. Activate it manually, or it will activate automatically at its scheduled departure time.",
      "activateButton": "Activate trip",
      "snoozeLabel": "Snooze arrival time",
      "verifyButton": "✓ Verify arrival",
      "inactiveHint": "The trip is {status} - no further actions available.",
      "deleteButton": "Delete trip",
      "mmsiConflictError": "The trip cannot be activated — another active trip is already using this MMSI number.",
      "activated": "The trip has been activated",
      "actionFailed": "The action failed.",
      "snoozed": "Arrival time postponed {minutes} min",
      "verifyConfirm": "Confirm that the vessel has arrived safely?",
      "verified": "Arrival verified - the trip is completed",
      "deleteForceConfirm": "There are registered people on the trip. Delete the trip anyway? Remember to notify them yourself.",
      "deleteConfirm": "Delete this trip?",
      "deleteAnywayButton": "Delete anyway",
      "deleteHasPersonsWarning": "The trip has {crewCount} crew member(s) and {iceCount} ICE contact(s) registered who may need to be notified. Click again to delete anyway.",
      "deleteFailed": "Could not delete the trip.",
      "deleted": "The trip has been deleted"
    },
    "log": {
      "heading": "Change log",
      "empty": "No changes logged."
    }
  },
  "landing": {
    "meta": {
      "title": "Yachting Earth — Voyage Preparation & Emergency Information for Sailors",
      "description": "Yachting Earth is a digital voyage dossier for sailors: register your vessel, routes, crew and emergency contact before departure, so accurate information is already in place if a voyage does not go as planned."
    },
    "skipLink": "Skip to main content",
    "nav": {
      "prepared": "What's prepared",
      "howItWorks": "How it works",
      "different": "Why it's different",
      "privacy": "Privacy",
      "login": "Log in",
      "cta": "Create Free Account"
    },
    "hero": {
      "heading": "Every voyage deserves a plan.<br>Every emergency deserves the right information.",
      "lead": "Prepare your vessel, routes, crew and emergency contact before departure. If you fail to check in after your planned arrival, your designated emergency contact receives secure access to the information that may help emergency services respond faster.",
      "ctaPrimary": "Create Free Account",
      "ctaSecondary": "How It Works",
      "badges": [
        "Free to use",
        "Multiple routes",
        "GDPR by design",
        "Secure ICE Portal"
      ]
    },
    "notice": {
      "heading": "Important",
      "p1": "Yachting Earth ICE is not a distress beacon, EPIRB or real-time tracking system.",
      "p2": "It is a voyage preparation and emergency information system designed to ensure that the right person has the right information at the right time if something unexpected happens, the whole way from the dock to a completed rescue operation."
    },
    "prepared": {
      "heading": "Everything is prepared before departure",
      "lead": "A complete voyage dossier, assembled before you even leave the dock.",
      "cards": [
        {
          "icon": "ship",
          "title": "Vessel",
          "items": [
            "Photo",
            "Registration",
            "Specifications",
            "Identification"
          ]
        },
        {
          "icon": "compass",
          "title": "Voyage",
          "items": [
            "Departure",
            "Destination",
            "Estimated arrival",
            "Grace period"
          ]
        },
        {
          "icon": "route",
          "title": "Routes",
          "items": [
            "Multiple routes",
            "Import from GPX/Windy/draw",
            "Route alternatives",
            "Interactive map preview"
          ]
        },
        {
          "icon": "users",
          "title": "Crew",
          "items": [
            "Crew list",
            "Individual profiles",
            "Photos",
            "Personal emergency contacts"
          ]
        },
        {
          "icon": "shield-check",
          "title": "Emergency Contact",
          "items": [
            "Identity confirmed",
            "Secure portal",
            "Read-only access",
            "Automatic notification"
          ]
        }
      ]
    },
    "howItWorks": {
      "heading": "How it works",
      "steps": [
        "Skipper creates voyage",
        "Invites crew",
        "Crew complete their own profiles",
        "Emergency contact confirms participation",
        "Activate voyage"
      ],
      "fork": {
        "arriveTitle": "Arrive safely",
        "arriveText": "Skipper verifies arrival. Nothing further happens.",
        "graceTitle": "Grace period expires",
        "graceText": "Skipper has not checked in after ETA plus the configured grace period."
      },
      "afterFork": [
        "Emergency contact notified",
        "Information ready to be shared if emergency services must be contacted"
      ]
    },
    "compare": {
      "heading": "Why Yachting Earth is different",
      "traditionalLabel": "Traditional Plan",
      "yachtingLabel": "Yachting Earth",
      "rows": [
        {
          "traditional": "Static documents",
          "yachting": "Living voyage information"
        },
        {
          "traditional": "Single route",
          "yachting": "Multiple routes"
        },
        {
          "traditional": "Basic crew list",
          "yachting": "Crew maintain their own details"
        },
        {
          "traditional": "Rely on manual monitoring",
          "yachting": "Automatic audited control"
        },
        {
          "traditional": "Sticky notes, texts and calls",
          "yachting": "Secure portal"
        }
      ]
    },
    "features": {
      "heading": "Built for real voyages",
      "items": [
        {
          "icon": "route",
          "title": "Multiple routes",
          "description": "A voyage rarely follows a single straight line."
        },
        {
          "icon": "users",
          "title": "Crew participation",
          "description": "Every crew member maintains their own information."
        },
        {
          "icon": "shield-check",
          "title": "Verified emergency contact",
          "description": "The emergency contact confirms their role before departure."
        }
      ]
    },
    "privacy": {
      "heading": "Privacy by design",
      "lead": "Personal voyage data is automatically removed according to GDPR principles.",
      "lifecycle": [
        {
          "icon": "file-plus",
          "label": "Voyage created"
        },
        {
          "icon": "check-circle",
          "label": "Voyage completed"
        },
        {
          "icon": "clock",
          "label": "Soft deleted"
        },
        {
          "icon": "timer",
          "label": "Automatically removed after 30 days"
        },
        {
          "icon": "shield",
          "label": "Only skipper and vessel remain"
        }
      ]
    },
    "mapDemo": {
      "heading": "Routes, mapped",
      "lead": "A voyage may include several planned routes. Here is an example of three.",
      "note": "Demonstration data — not a live vessel position.",
      "ariaLabel": "Example map showing three sample sailing routes along a coastline",
      "routes": [
        "Stockholm → Sandhamn",
        "Sandhamn → Landsort",
        "Stockholm → Åland (alternative)"
      ],
      "descriptions": [
        "Primary route",
        "If the wind shifts westerly",
        "If the wind shifts north and picks up above 35 knots"
      ]
    },
    "worst": {
      "heading": "If the worst happens",
      "insteadTitle": "Instead of…",
      "insteadItems": [
        "Searching old emails",
        "Trying to remember who was onboard",
        "Looking for route screenshots",
        "Guessing emergency contacts"
      ],
      "haveTitle": "Your emergency contact already has",
      "haveItems": [
        "Vessel",
        "Routes",
        "Crew",
        "Photos",
        "Emergency contacts",
        "Voyage details"
      ],
      "readyTitle": "Ready to provide",
      "readyItems": [
        "Coast Guard",
        "Police",
        "Rescue Coordination Centre",
        "Insurance company"
      ],
      "readyNote": "The emergency contact decides when the information should be shared, and with whom."
    },
    "finalCta": {
      "heading": "Ready for your next voyage?",
      "lead": "Register your first voyage in less than five minutes.",
      "cta": "Create Free Account"
    },
    "footer": {
      "disclaimer": "Yachting Earth ICE is a voyage preparation and information tool. It is not a distress beacon, EPIRB or real-time tracking system, and the system itself does not contact rescue services.",
      "links": {
        "about": "About",
        "blog": "Blog",
        "privacy": "Privacy",
        "gdpr": "GDPR",
        "contact": "Contact",
        "terms": "Terms",
        "faq": "FAQ"
      },
      "comingSoon": "{page} page coming soon"
    }
  },
  "privacy": {
    "title": "Privacy & GDPR",
    "lastUpdated": "Last updated: 14 July 2026",
    "intro": "This page explains what personal data Yachting Earth ICE collects, why, how long it is kept, and the rights you have over it under GDPR.",
    "sections": [
      {
        "heading": "Who operates this service",
        "body": [
          "Yachting Earth ICE (\"the system\") is owned and operated by Manjo Consulting AB, a Swedish company (org./VAT no. 5568138464), trading as Yachting Earth (yachting.earth). It is a voyage-preparation and crew-safety check-in tool - not a distress beacon, EPIRB or real-time tracking system, and it does not contact emergency services itself. The skipper remains responsible for actual safety decisions; this page explains how the system handles the personal data you give it in support of that."
        ]
      },
      {
        "heading": "What data we collect",
        "body": [
          "We only collect what the system needs to prepare a voyage and, if something goes wrong, to get the right information to the right person."
        ],
        "list": [
          "Account data - email, name, phone, and a password (stored only as a bcrypt hash, never in plain text)",
          "Vessel data - name, registration/call sign, specifications, and an optional photo",
          "Trip data - planned routes (parsed from Windy.com), scheduled departure/arrival times, and grace period",
          "Crew data - name, email, phone, and an optional photo for identification purposes",
          "Emergency contact (\"ICE\") data - name, email, phone, and relationship to the skipper",
          "Security logs - login attempts (to enforce rate limiting) and notification delivery status"
        ]
      },
      {
        "heading": "Why we process it",
        "body": [
          "Each category of data is processed on one of these legal bases:"
        ],
        "list": [
          "Contract - account, vessel and trip data, so the system can do what you signed up for",
          "Explicit consent - emergency contact details",
          "Legitimate interest - crew photo uploads for identification purposes, and security logs and notification delivery records, to keep the system reliable and abuse-resistant"
        ]
      },
      {
        "heading": "How long we keep it",
        "body": [
          "A completed or cancelled trip is soft-deleted immediately - it disappears from the skipper's, crew's and emergency contact's view - and then permanently (hard-)deleted, along with its routes, crew records, photos, audit log, notifications and access tokens, by a daily cleanup job 30 days later.",
          "Registered user accounts and vessels are not touched by this process - only the trip's own data is. You can delete your account and its data at any time from your profile page.",
          "Emergency contact accounts are also kept indefinitely by default, since the contact may need to sign back in for a future trip, but a contact can opt in - from \"My ICE account\" - to have their account deleted automatically once it is no longer linked to any current or future trip.",
          "Messages sent through the contact form (your name, email, and message text) are kept for 18 months from when you send them, then permanently deleted. This 18-month period runs on its own and is not shortened by deleting your account - if you delete your account, your past messages are still kept until their own 18-month period ends, unless we delete them sooner. We may delete a message earlier than 18 months, for example once a request is resolved."
        ]
      },
      {
        "heading": "Your rights",
        "body": [
          "Under GDPR you can:"
        ],
        "list": [
          "Access the personal data we hold about you",
          "Correct inaccurate data - most of it you can edit directly from your profile",
          "Erase your account and its associated data, using the \"Delete account\" option on your profile page (contact-form messages you've sent are the one exception - see \"How long we keep it\" above)",
          "Receive your data in a portable, machine-readable format",
          "Withdraw a consent you previously gave, for example an emergency contact confirmation",
          "Lodge a complaint with the supervisory authority responsible for data protection - in Sweden, the Swedish Authority for Privacy Protection (Integritetsskyddsmyndigheten, IMY, imy.se) - under GDPR Article 77"
        ]
      },
      {
        "heading": "If you don't have an account",
        "body": [
          "If you were added as crew for a trip, or as an emergency (\"ICE\") contact, without creating an account, you can still exercise the rights above. Go to the login page and follow the \"Invited as crew without an account? Manage your data here.\" link, enter the email address your invitation was sent to, and we'll email you a secure, time-limited access link. From that portal you can download your data, request immediate deletion of your crew record on a trip that's already finished, or send us a message directly."
        ]
      },
      {
        "heading": "Cookies and tracking",
        "body": [
          "We don't use cookies. Your login session is kept in your browser's local storage, and there is no third-party analytics or advertising tracking anywhere in the system."
        ]
      },
      {
        "heading": "Who we share data with",
        "body": [
          "We never sell or share your data with advertisers. Data only reaches:"
        ],
        "list": [
          "Mailgun - to deliver transactional email (trip notifications, invitations, alerts)",
          "Telegram and Twilio WhatsApp - to deliver notifications, where enabled",
          "Our hosting provider - to run and back up the service",
          "Cloudflare (cdnjs) and unpkg - to serve the Leaflet and Lucide code libraries used by the app; these providers see the IP address and browser (User-Agent) of every visitor who loads a page",
          "OpenStreetMap - to serve the map tiles shown on route/trip maps; OpenStreetMap sees the IP address and browser (User-Agent) of anyone who views a map, along with the map area requested"
        ]
      },
      {
        "heading": "International data transfers",
        "body": [
          "Mailgun and Twilio (WhatsApp), listed above, are US-headquartered processors, so notification content - recipient names, emails, phone numbers and trip alert text - may be transferred to and processed in the United States. Where this happens, we rely on those providers' participation in the EU-US Data Privacy Framework and/or Standard Contractual Clauses to ensure your data receives an equivalent level of protection outside the EEA."
        ]
      },
      {
        "heading": "How we protect it",
        "body": [
          "The system runs entirely over HTTPS. Passwords are hashed with bcrypt. Skippers authenticate with a signed token; emergency contacts and search-and-rescue authorities get single-use, read-only access scoped to a single trip instead of a login. Crew, vessel and profile photos are stored outside the public web server and are only ever served through an authenticated request. Repeated failed logins are rate-limited."
        ]
      }
    ],
    "contact": {
      "heading": "Questions?",
      "body": "To exercise any of the rights above, or for any other question about this policy or your data, get in touch using the contact form available in your account. We respond within 30 days, as required by GDPR Article 12."
    }
  },
  "terms": {
    "title": "Terms of Service",
    "lastUpdated": "Last updated: 11 July 2026",
    "intro": "These terms govern your use of Yachting Earth ICE. By creating an account or accessing the system, you agree to them.",
    "sections": [
      {
        "heading": "Who you're agreeing with",
        "body": [
          "Yachting Earth ICE (\"the system\") is owned and operated by Manjo Consulting AB, a Swedish company (org./VAT no. 5568138464), trading as Yachting Earth (yachting.earth)."
        ]
      },
      {
        "heading": "What the service is",
        "body": [
          "Yachting Earth ICE is a voyage-preparation and crew safety check-in notification tool. It lets a skipper register a trip and vessel, add planned routes, invite crew, and designate an emergency (\"ICE\") contact who is notified if the trip becomes overdue."
        ],
        "list": [
          "It is not a distress beacon, EPIRB, or real-time tracking system",
          "It does not monitor a vessel's actual position and does not contact rescue services itself",
          "The skipper remains solely responsible for actual safety decisions, seaworthiness, and compliance with maritime law and local regulations"
        ]
      },
      {
        "heading": "Your account",
        "body": [
          "You must provide accurate information when registering a trip, vessel, crew member, or emergency contact, and keep it up to date - the system's usefulness depends on it being current.",
          "You are responsible for keeping your login credentials confidential and for all activity under your account. Tell us promptly if you believe your account has been compromised."
        ]
      },
      {
        "heading": "Acceptable use",
        "body": [
          "You agree not to:"
        ],
        "list": [
          "Use the system for any unlawful purpose or to harass, impersonate, or deceive another person",
          "Add a crew member or emergency contact without a reasonable basis for believing they consent to being contacted about the trip",
          "Attempt to interfere with, disrupt, or gain unauthorized access to the system or other users' data"
        ]
      },
      {
        "heading": "Emergency contacts and crew",
        "body": [
          "Emergency contacts and crew you invite receive their own limited-purpose access (a read-only trip view or an invitation to confirm details) and are bound by these terms for that purpose. You are responsible for having a lawful basis to share their contact details with us."
        ]
      },
      {
        "heading": "Availability and limitation of liability",
        "body": [
          "We aim to keep the system available and notifications timely, but we do not guarantee uninterrupted availability, and delivery of email, Telegram, or WhatsApp notifications depends on third-party services outside our control.",
          "To the maximum extent permitted by law, Manjo Consulting AB is not liable for any loss or damage arising from reliance on the system for actual safety-critical decisions, from delayed or failed notifications, or from inaccurate information entered by a user. The system is provided \"as is\" as an information-management aid, not a safety guarantee."
        ]
      },
      {
        "heading": "Third-party services",
        "body": [
          "The system relies on third-party services to operate: Mailgun for email delivery, Telegram and Twilio WhatsApp for optional notifications, OpenStreetMap for map tiles, and Windy.com as a source for route planning. Your use of those services is subject to their own terms."
        ]
      },
      {
        "heading": "Termination",
        "body": [
          "You may delete your account at any time from your profile page. We may suspend or terminate access to accounts that violate these terms or that we reasonably believe pose a risk to the system or other users."
        ]
      },
      {
        "heading": "Changes to these terms",
        "body": [
          "We may update these terms from time to time. Material changes will be reflected by updating the \"Last updated\" date above. Continued use of the system after a change constitutes acceptance of the updated terms."
        ]
      },
      {
        "heading": "Governing law",
        "body": [
          "These terms are governed by the laws of Sweden, without regard to conflict-of-law principles. Any dispute arising from these terms or your use of the system falls under the jurisdiction of the Swedish courts."
        ]
      }
    ],
    "contact": {
      "heading": "Questions?",
      "body": "For any question about these terms, get in touch using the contact form available in your account."
    }
  },
  "contact": {
    "title": "Contact",
    "subtitle": "Have a question, found a bug, or want to request a feature? Send us a message and we'll get back to you.",
    "categoryLabel": "What is this about?",
    "category": {
      "general": "General inquiries",
      "privacyGdpr": "Privacy & GDPR requests",
      "bug": "Bugs and issues",
      "featureRequest": "Improvements and feature requests"
    },
    "messageLabel": "Message",
    "attachmentsLabel": "Attachments",
    "attachmentsHint": "Optional. Up to 5 files, 1MB each (images or PDF).",
    "retentionHint": "We keep messages sent through this form for 18 months, then delete them - this doesn't change if you delete your account in the meantime. See our Privacy Policy for details.",
    "submit": "Send message",
    "submitting": "Sending...",
    "success": "Your message has been sent. We'll get back to you soon.",
    "submitFailed": "Failed to send your message. Please try again."
  },
  "about": {
    "title": "About us",
    "intro": "Yachting Earth ICE is built and operated by Manjo Consulting AB, a Swedish company (org./VAT no. 5568138464), trading as Yachting Earth (yachting.earth).",
    "sections": [
      {
        "heading": "Why we built this",
        "body": [
          "Every skipper knows the routine: tell someone ashore your route and your expected arrival time, then check in when you're safely in port. In practice that plan lives in a text message or a scribbled note, and it's easy for the details - the actual route, the crew on board, who to call and when - to get lost or go stale between trips.",
          "Yachting Earth ICE turns that routine into a structured, repeatable check-in: register the trip and vessel once, invite your crew, and the system watches the clock so your designated emergency (\"ICE\") contact always has accurate, up-to-date information if you don't check in on time."
        ]
      },
      {
        "heading": "What we are - and what we're not",
        "body": [
          "This is a voyage-preparation and crew-safety information tool, not a distress beacon, EPIRB, or real-time tracking system. It doesn't monitor your vessel's position and it doesn't contact rescue services itself."
        ],
        "list": [
          "You (the skipper) remain responsible for actual safety decisions at sea",
          "The system's job is to make sure the right information reaches the right person if a trip runs overdue",
          "Everything the system does - grace periods, snoozing an ETA, notifying an ICE contact - is there to support your own judgement, not replace it"
        ]
      },
      {
        "heading": "Who's behind it",
        "body": [
          "Manjo Consulting AB is a Swedish company that designs and operates Yachting Earth ICE end to end - product, engineering, and support. We're sailors ourselves, and we built the tool we wished existed for our own trips."
        ]
      }
    ],
    "contact": {
      "heading": "Get in touch",
      "body": "Questions about the company behind Yachting Earth, or about the service itself? Get in touch using the contact form available in your account, or see our Privacy & GDPR and Terms of Service pages for more detail on how the system works."
    }
  },
  "faq": {
    "title": "Frequently Asked Questions",
    "lead": "Common questions about how Yachting Earth ICE works. Can't find what you're looking for? Get in touch using the contact form available in your account.",
    "categories": [
      {
        "heading": "Getting started",
        "items": [
          {
            "q": "What is Yachting Earth ICE?",
            "a": "It's a voyage-preparation and crew safety check-in tool. A skipper registers a trip and vessel, adds one or more planned routes, invites crew, and designates an emergency (\"ICE\") contact who is notified automatically if the trip becomes overdue."
          },
          {
            "q": "Is this a distress beacon or real-time tracking system?",
            "a": "No. Yachting Earth ICE does not track a vessel's live position and does not contact rescue services itself. It's an information-management tool - the skipper remains responsible for actual safety decisions. In a genuine emergency, always contact your local rescue coordination centre or coast guard directly."
          },
          {
            "q": "How do I add a route to a trip?",
            "a": "Plan your route on Windy.com's route planner, then paste the resulting URL into the trip form. It's parsed automatically into coordinates and shown on the map. A trip can have more than one planned route."
          },
          {
            "q": "How do I invite crew?",
            "a": "From the trip detail page, add a crew member by email. They receive an invitation to confirm their details and, optionally, create their own account and upload a photo."
          }
        ]
      },
      {
        "heading": "Safety & notifications",
        "items": [
          {
            "q": "What is the grace period?",
            "a": "It's a buffer added to the trip's scheduled arrival time before it's considered overdue - to allow for normal delays without triggering a false alarm. You choose the grace period when creating the trip."
          },
          {
            "q": "What happens if a trip becomes overdue?",
            "a": "A background job checks every minute for trips past their scheduled arrival plus grace period. Once a trip is overdue, the ICE contact is notified by email and, if configured, Telegram or WhatsApp."
          },
          {
            "q": "I'm running late - how do I avoid triggering an alert?",
            "a": "Open your trip and use \"Snooze\" to extend the expected arrival time at any point before the deadline passes."
          },
          {
            "q": "How do I mark a trip as safely completed?",
            "a": "Open the trip and select \"Verify arrival\". This can be done at any time, including after an alert has already been sent - your ICE contact receives an update either way."
          },
          {
            "q": "How does my emergency contact see the trip details?",
            "a": "They get a read-only link to a trip portal, protected by a private access token - no account or login required. Search and rescue authorities can alternatively look up a trip using a reference number and PIN."
          },
          {
            "q": "Does my ICE contact need to confirm before they can be notified?",
            "a": "No. Confirming their email just verifies the address works, but timeout alerts are sent regardless - gating a safety alert on a clicked link would defeat the purpose."
          }
        ]
      },
      {
        "heading": "Privacy & data",
        "items": [
          {
            "q": "What happens to my data after a trip ends?",
            "a": "A completed or cancelled trip is soft-deleted immediately (it disappears from view) and then permanently deleted, along with its routes, crew records, photos and notifications, 30 days later. Your account and vessels are not affected. See the Privacy & GDPR page for full details."
          },
          {
            "q": "Can I delete my account?",
            "a": "Yes, at any time from your profile page."
          },
          {
            "q": "Is my data shared with anyone?",
            "a": "Never sold or shared with advertisers. It only reaches the services needed to run the system, such as our email and notification providers. See the Privacy & GDPR page for the full list."
          }
        ]
      }
    ]
  }
};

const I18n = {
  SUPPORTED: ['en', 'sv'],
  DEFAULT: 'en',
  _dicts: { en: EN_INLINE },
  _lang: null,

  getLang() {
    const hashQuery = (location.hash.split('?')[1] || '');
    const fromQuery = new URLSearchParams(hashQuery).get('lang');
    if (fromQuery && this.SUPPORTED.includes(fromQuery)) return fromQuery;

    const fromStorage = localStorage.getItem('ye_lang');
    if (fromStorage && this.SUPPORTED.includes(fromStorage)) return fromStorage;

    const browserLang = (navigator.language || '').split('-')[0];
    if (browserLang && this.SUPPORTED.includes(browserLang)) return browserLang;

    return this.DEFAULT;
  },

  async load(lang) {
    this._lang = lang;
    if (this._dicts[lang]) return;
    try {
      const res = await fetch(`i18n/${lang}.json`, { cache: 'no-cache' });
      this._dicts[lang] = await res.json();
    } catch (err) {
      console.warn(`I18n: failed to load "${lang}", falling back to ${this.DEFAULT}`, err);
    }
  },

  setLang(lang) {
    if (!this.SUPPORTED.includes(lang)) return;
    localStorage.setItem('ye_lang', lang);
    // Emailed links (ice-confirm, ice-portal, crew-join, ...) bake in a
    // ?lang= query param that getLang() prioritizes over localStorage. Strip
    // it so the explicit choice just saved above actually wins on reload,
    // instead of the stale link language re-asserting itself every time.
    this._stripLangFromHash();
    // A soft re-render leaves stale strings behind in places that only read
    // a dictionary once (e.g. EN_INLINE-derived state); reload so every
    // page picks up the new language from scratch.
    if (lang === this._lang) return;
    location.reload();
  },

  _stripLangFromHash() {
    const [hashPath, hashQuery = ''] = location.hash.split('?');
    const params = new URLSearchParams(hashQuery);
    if (!params.has('lang')) return;
    params.delete('lang');
    const newQuery = params.toString();
    location.hash = newQuery ? `${hashPath}?${newQuery}` : hashPath;
  }
};

function lookup(dict, key) {
  return key.split('.').reduce((node, part) => (node && typeof node === 'object' ? node[part] : undefined), dict);
}

function interpolate(text, vars) {
  if (!vars) return text;
  return Object.keys(vars).reduce((s, k) => s.replace(new RegExp(`\\{${k}\\}`, 'g'), vars[k]), text);
}

function t(key, vars) {
  const lang = I18n._lang || I18n.DEFAULT;
  let text = lookup(I18n._dicts[lang], key);

  if (text === undefined && lang !== I18n.DEFAULT) {
    text = lookup(I18n._dicts[I18n.DEFAULT], key);
  }

  if (text === undefined) {
    if (CONFIG && CONFIG.API_BASE_URL && CONFIG.API_BASE_URL.includes('localhost')) {
      console.warn(`I18n: missing key "${key}"`);
    }
    text = key;
  }

  return interpolate(text, vars);
}

t.error = (code, vars) => t('errors.' + (code || 'UNKNOWN'), vars);

// Grace-period seconds -> translated label, e.g. 86400 -> "24 hours" / "24 timmar".
// CONFIG.GRACE_PERIOD_OPTIONS (config.js) only carries seconds/hours since it
// loads before the active language dictionary is ready.
function formatGracePeriod(seconds) {
    const option = CONFIG.GRACE_PERIOD_OPTIONS.find((g) => g.seconds === Number(seconds));
    return option ? t('common.gracePeriod.h' + option.hours) : String(seconds);
}
