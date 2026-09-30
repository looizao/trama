window.executionLog={
  "updated": "2026-09-30T04:35:23-03:00",
  "defaults": [
    "Local-only work; no pushes, deployment, production data or infrastructure access.",
    "Six-photo experiment only. No dense capture arm approved or implied.",
    "Fresh fictional SQLite database, local storage and disabled external image generation.",
    "Local reminder queue is the reversible default; external messages require explicit authorization.",
    "Professional acceptance and final route choice remain pending.",
    "User deferred and erased the local backup/restore flow. Do not rebuild it during this delivery without later instruction."
  ],
  "tasks": [
    {
      "id": "00",
      "title": "Recovered checkout and local baseline",
      "depends": [],
      "requirement": "Read all decisions and source; preserve prior work; establish real local behavior and portable execution log.",
      "criteria": [
        "Real Git history restored from the supplied repository; local branch and original snapshot retained.",
        "Fresh local SQLite and local media storage; no external processing or production access.",
        "Login, client, upload, milestone placement and reload exercised; failure behavior checked.",
        "Go checks and web build pass; dated browser evidence and log navigation verified; milestone committed."
      ],
      "status": "verified",
      "changes": [
        "Read map.md, demo-plan.md and all 21 issue files; later broad MVP decision applied.",
        "Restored real repository history from https://github.com/looizao/trama at 45a6d8accd5bbcf2f54b28631aaba4cbc7df80ae.",
        "Created local/visagist-mvp. On user instruction replaced obsolete local app files; prior source and private data archived under ignored .scratch/private.",
        "Created scripts/dev-local.sh for isolated loopback SQLite/local-media operation with external generation disabled."
      ],
      "limitations": [
        "Baseline confirms only existing client/image/milestone behavior. No 3D or new product workflows have been implemented."
      ],
      "verification": [
        {
          "command": "git status --short --branch",
          "result": "Clean repository after source recovery; branch local/visagist-mvp."
        },
        {
          "command": "Source inspection",
          "result": "Latest existing commit uses SQLite. Earlier snapshot used PostgreSQL. No consultations, labeled views, permission/deletion endpoints, 3D catalog/viewer or comparative demos exist."
        },
        {
          "command": "mise exec go@1.26.0 -- go test ./...",
          "result": "PASS: cmd/api and internal/app; worker and migration compile."
        },
        {
          "command": "npm --prefix web run build",
          "result": "PASS: TypeScript and Vite 7.3.6; 169 modules, JS 361.52 kB (114.29 kB gzip)."
        },
        {
          "command": "Local API and browser flow",
          "result": "Health 200; anonymous clients 401; login 200; invalid client 400; client and milestone 201; diagnostic PNG upload 201; content bytes unchanged; placement 200; reload preserves content; unconfigured generation 503; nonexistent DELETE endpoint 404."
        }
      ],
      "pictures": [
        {
          "src": "assets/baseline-login.png",
          "caption": "Fresh local login. Isolated credentials; no production data.",
          "date": "2026-09-29T21:49:12-03:00"
        },
        {
          "src": "assets/baseline-progression.png",
          "caption": "Persisted fictional client and baseline milestone after browser reload. Green image is a diagnostic transfer fixture, not a portrait or reconstruction input.",
          "date": "2026-09-29T21:49:12-03:00"
        }
      ],
      "commits": [
        "3f84aee"
      ],
      "outputs": [],
      "events": [
        {
          "date": "2026-09-29T21:46:30-03:00",
          "text": "Execution initiated. One task active. All eight alternatives retained; no winning route chosen."
        },
        {
          "date": "2026-09-29T21:49:12-03:00",
          "text": "Baseline and execution log verified; preparing coherent local milestone commit."
        },
        {
          "date": "2026-09-29T21:49:39-03:00",
          "text": "User requested local demo credentials in AGENTS.md and mandated the same account for local use. Added existing credentials locally; AGENTS.md excluded from milestone staging to keep credentials out of Git."
        }
      ]
    },
    {
      "id": "01",
      "title": "Affirmative permission, withdrawal and media lifecycle",
      "depends": [
        "00"
      ],
      "requirement": "Apply approved private studio permission and deletion policy before handling client material.",
      "criteria": [
        "Client acknowledgement includes notice version, date and method; professional checkbox alone is insufficient.",
        "Upload and processing require active permission; another studio cannot access records or media.",
        "Individual deletion removes transitive dependent media; withdrawal and client deletion cancel jobs and purge temporary material.",
        "Tombstones and completion-time guards prevent delayed work recreating removed material; audit retains no deleted media.",
        "UI confirmation explains affected data and request status; reload and failure paths verified."
      ],
      "status": "verified",
      "changes": [],
      "limitations": [
        "Locally verified for existing image assets and generation runs. Future 3D outputs must register provenance and use the same mutation guards; later tasks remain pending.",
        "Acknowledgement records a client-entered affirmation; identity verification is not claimed. No real client inputs used.",
        "Cloud object deletion and Temporal cancellation code added, but no production storage or production worker was accessed. Production rollout remains unverified.",
        "Backup creation, expiry and restore are deferred by superseding user instruction. Client deletion and interrupted cleanup safeguards remain active."
      ],
      "verification": [
        {
          "command": "mise exec go@1.26.0 -- go test ./...",
          "result": "PASS, including acknowledgement/version/name rejection, cross-studio access/deletion denial, transitive media erasure, renewed permission across restart, separate-worker late-result cancellation, missing/corrupt ledger fail-closed behavior and cleanup retry on restart."
        },
        {
          "command": "mise exec go@1.26.0 -- go test -race ./internal/app",
          "result": "PASS; separate App/worker race fixture prevents late image recreation and cancellation overwrite."
        },
        {
          "command": "python scripts/verify-local-privacy.py",
          "result": "PASS: full running local flow through anonymous denial, client link, wrong-name rejection, active upload/read, unconfirmed deletion failure, withdrawal, missing media after reload, re-acknowledgement, new upload, client deletion and retained completion history."
        },
        {
          "command": "npm --prefix web run build",
          "result": "PASS: 170 modules; final JS 375.60 kB (118.28 kB gzip)."
        },
        {
          "command": "@Browser acknowledgement and withdrawal checks",
          "result": "Client entry succeeded and persisted after reload. Impact displays 1 diagnostic image and 0 jobs. CLI removal returned completed; reload shows withdrawn, zero images, blocked uploads and completed request history. Portuguese view inspected."
        }
      ],
      "pictures": [
        {
          "src": "assets/permission-required.png",
          "caption": "Existing local diagnostic media requires fresh client acknowledgement before access or further uploads.",
          "date": "2026-09-29T22:01:48-03:00"
        },
        {
          "src": "assets/client-acknowledgement.png",
          "caption": "Client-facing workflow records a fictional test acknowledgement without a client account; no studio proxy checkbox.",
          "date": "2026-09-29T22:01:48-03:00"
        },
        {
          "src": "assets/permission-active.png",
          "caption": "Studio sees acknowledgement name, method, date and notice version after reload.",
          "date": "2026-09-29T22:01:48-03:00"
        },
        {
          "src": "assets/withdrawal-impact.png",
          "caption": "Review names the affected media, cancellation, dependent removal and retained request status before confirmation.",
          "date": "2026-09-29T22:07:50-03:00"
        },
        {
          "src": "assets/withdrawal-complete.png",
          "caption": "After removal and reload: withdrawn permission, zero images, disabled upload and completed privacy request.",
          "date": "2026-09-29T22:07:50-03:00"
        },
        {
          "src": "assets/privacy-portuguese.png",
          "caption": "Localized privacy and withdrawal status in Portuguese.",
          "date": "2026-09-29T22:07:50-03:00"
        },
        {
          "src": "assets/privacy-guards.svg",
          "caption": "Diagnostic overview alongside actual API, persistence, race and failure verification results.",
          "date": "2026-09-29T22:07:50-03:00"
        }
      ],
      "commits": [
        "d428514"
      ],
      "outputs": [],
      "events": [
        {
          "date": "2026-09-29T21:49:39-03:00",
          "text": "Starting affirmative permission and cascading media lifecycle with server-side guards."
        },
        {
          "date": "2026-09-29T22:01:48-03:00",
          "text": "Implemented one-time, 15-minute client acknowledgement pages and private studio controls. Added transitive deletion, durable ledger, recovery on startup, shared API/worker file locks, cancelled-run preservation and late-result rejection."
        },
        {
          "date": "2026-09-29T22:07:50-03:00",
          "text": "Browser assertion initially searched capitalized Withdrawn; CSS capitalizes the visible label while DOM text is lowercase. Corrected the assertion using observed state; application withdrawal behavior was correct."
        },
        {
          "date": "2026-09-29T22:07:50-03:00",
          "text": "Task verified locally. Remaining product and all comparative demos remain pending. Preparing local commit before moving to backup safeguards."
        }
      ]
    },
    {
      "id": "02",
      "title": "Local backup flow (deferred by user)",
      "depends": [
        "01"
      ],
      "requirement": "Test encrypted local backups, maximum 30-day expiry and deletion-aware restoration.",
      "criteria": [
        "Snapshot, encryption, download-equivalent copy, decryption and SQLite integrity verified locally.",
        "Expired archives rejected and removed; restore replays a protected deletion ledger before serving.",
        "Stale backup cannot restore deleted originals or derivatives; no production backup changes."
      ],
      "status": "blocked",
      "changes": [
        "Built an initial local encrypted snapshot experiment, verified copy/decrypt and SQLite integrity, then erased the entire new backup/restore implementation at the user's request.",
        "Removed scripts/local-backup.py, cmd/local-privacy-replay, the generated encrypted test archive and its local passphrase.",
        "Removed the existing backup deployment script and systemd service/timer from the local checkout. Removed unimplemented backup promises from client consent and deletion explanations in English and Portuguese. Updated local AGENTS instructions to defer backups."
      ],
      "limitations": [
        "User explicitly deferred rebuilding the backup flow. No backup expiry/restore implementation is being delivered or claimed complete.",
        "Backup deployment source was removed locally. Production infrastructure, running services and stored backups were neither accessed nor changed."
      ],
      "verification": [
        {
          "command": "Initial local snapshot experiment (subsequently erased)",
          "result": "Created one 7,517-byte encrypted synthetic local archive and verified retained copy, decryption and SQLite integrity. Deleted this archive and its key after the user cancelled the flow. No deletion-aware restored database test had been performed."
        },
        {
          "command": "Removal inspection",
          "result": "New local backup script, replay command, archive directory and key no longer exist. The committed client deletion ledger and media guards remain intact."
        },
        {
          "command": "mise exec go@1.26.0 -- go test ./...",
          "result": "PASS all Go packages after backup removal."
        },
        {
          "command": "npm --prefix web run build",
          "result": "PASS TypeScript and Vite build, 170 modules."
        },
        {
          "command": "python scripts/verify-local-privacy.py",
          "result": "PASS full local permission, upload, withdrawal, deletion, reload and failure checks using the mandated demo account. No backup operation performed."
        },
        {
          "command": "In-app Browser: open withdrawal impact, inspect then cancel",
          "result": "PASS privacy explanation contains no backup promises. Diagnostic screenshot retained; no deletion action submitted."
        }
      ],
      "pictures": [
        {
          "src": "assets/backup-flow-removed.png",
          "caption": "Local withdrawal impact after removing backup promises. No photos or media in this fictional client.",
          "date": "2026-09-29T22:15:56-03:00"
        }
      ],
      "commits": [
        "4d862fc6ad79021a3e031a3ddce0a6801458bd5f"
      ],
      "outputs": [],
      "events": [
        {
          "date": "2026-09-29T22:07:59-03:00",
          "text": "Privacy milestone committed as d428514. Starting local 30-day expiry and deletion-aware restore safeguards."
        },
        {
          "date": "2026-09-29T22:11:22-03:00",
          "text": "Superseding user instruction: erase all of this backup flow; rebuild later. Removed new work and deferred task. No backup milestone commit made."
        },
        {
          "date": "2026-09-29T22:14:48-03:00",
          "text": "Expanded the removal to all backup workflow source in this checkout. No production commands, services or stored backups changed."
        },
        {
          "date": "2026-09-29T22:15:56-03:00",
          "text": "Backup removal verified. Rebuilding remains deferred, not complete."
        }
      ]
    },
    {
      "id": "03",
      "title": "Consultations and reusable intake",
      "depends": [
        "00"
      ],
      "requirement": "Persist goals, maintenance tolerance, optional observations and reusable intake templates.",
      "criteria": [
        "Required fields validated by API and UI; incomplete records have clear errors.",
        "Templates are studio-private, reusable and editable without altering earlier consultations.",
        "Consultation versions and client preferences survive reload; studio boundaries tested."
      ],
      "status": "verified",
      "changes": [
        "Added studio-private reusable question templates with versioned edits, archival/reactivation, and optional required custom answers. Each consultation stores an immutable template snapshot.",
        "Added required client goal and low/moderate/high maintenance tolerance, optional preferences/routine, structured hair/beard observations and recommendation rationale. New visits and revisions persist independently.",
        "Progress log now follows task hashes on navigation/back/forward as well as selector changes."
      ],
      "limitations": [
        "Template questions and client preferences are user-entered text. No personality inference or automatic professional recommendation is performed. Professional review of the demo consultation remains pending.",
        "Maintenance tolerance uses reversible low/moderate/high choices plus free text. Up to 12 template questions; existing consultation snapshots remain editable only by appending revisions."
      ],
      "verification": [
        {
          "command": "mise exec go@1.26.0 -- go test ./...",
          "result": "PASS required fields, stale revision/template conflicts, snapshot preservation, archive restrictions, anonymous/foreign-studio isolation, persistence after reopening and consultation cascade on client deletion."
        },
        {
          "command": "python scripts/verify-local-consultations.py",
          "result": "PASS live required-field/custom-answer rejection, reusable template edit, immutable original questions, stale conflicts, persistence on reload and deletion of consultations with client."
        },
        {
          "command": "mise exec go@1.26.0 -- go test -race ./internal/app",
          "result": "PASS 1.887s, including consultation and privacy tests."
        },
        {
          "command": "npm --prefix web run build",
          "result": "PASS TypeScript and Vite, 171 modules, 388.20 kB JS / 123.23 kB gzip."
        },
        {
          "command": "In-app Browser: create template, incomplete intake, complete intake, edit template, revise, reload and inspect history",
          "result": "PASS original and new goal retained; template now v2 while both consultation snapshots remain v1. English and Portuguese labels rendered."
        },
        {
          "command": "Progress log: task selector, HTTP asset links and source-file existence checks",
          "result": "PASS task 03 renders criteria, actual checks and three dated screenshots. Every retained evidence picture exists and returns HTTP 200 via relative links."
        }
      ],
      "pictures": [
        {
          "src": "assets/consultation-intake-form.png",
          "caption": "Intermediate intake with required goal/maintenance, optional hair observation/rationale and required custom template answer. All inputs fictional.",
          "date": "2026-09-29T22:25:58-03:00"
        },
        {
          "src": "assets/consultation-history.png",
          "caption": "Reloaded history shows both revisions, original questions v1, and the edited reusable template v2. Fictional client only.",
          "date": "2026-09-29T22:25:58-03:00"
        },
        {
          "src": "assets/consultation-portuguese.png",
          "caption": "Portuguese labels and dates for the same preserved consultation history.",
          "date": "2026-09-29T22:25:58-03:00"
        }
      ],
      "commits": [
        "e3d10ce46329e83a0e9ee0faf4defe3002fd7998"
      ],
      "outputs": [],
      "events": [
        {
          "date": "2026-09-29T22:11:22-03:00",
          "text": "Backup flow erased and deferred by explicit user instruction. Advancing to the next independent task: consultations and reusable intake."
        },
        {
          "date": "2026-09-29T22:15:56-03:00",
          "text": "Beginning consultation and reusable intake implementation after verified backup removal."
        },
        {
          "date": "2026-09-29T22:22:27-03:00",
          "text": "API and frontend compile. Preparing local browser workflow and persistence checks; task not yet verified."
        },
        {
          "date": "2026-09-29T22:25:58-03:00",
          "text": "Browser automation label matching timed out twice. Inspected fresh DOM and used role/name locators to complete the same flow; no product error or unperformed save claimed."
        },
        {
          "date": "2026-09-29T22:26:41-03:00",
          "text": "Consultation milestone verified locally. Template and original/revised fictional intake remain available in the local app for professional review."
        }
      ]
    },
    {
      "id": "04",
      "title": "Guided labeled uploads",
      "depends": [
        "01",
        "03"
      ],
      "requirement": "Six view slots with optional crown/under-chin and honest incomplete input handling.",
      "criteria": [
        "Front, both three-quarter views, both profiles and back have capture guidance and labels.",
        "Review, replacement, optional details and missing-view summary work across reloads.",
        "Invalid uploads fail clearly; no silent claim that six views guarantee reconstruction."
      ],
      "status": "verified",
      "changes": [
        "Photo sets persist six main views and two optional details, missing-view counts, consultation links, reviewed replacements and reassignment of existing photos. Replaced images remain in gallery; explicit deletion uses the privacy workflow.",
        "Rejects corrupt or unsupported images before storage; defaults are 10 MB, 32 megapixels and 12000 pixels per side. Added the Go Authors’ WebP decoder v0.46.0 with verified BSD-3-Clause notice/provenance.",
        "Client gallery, progression and capture previews now hide media and disable processing when permission lookup fails. Python bytecode is excluded from Git."
      ],
      "limitations": [
        "Pictures in this milestone are colored diagnostic squares, never portraits or reconstruction accuracy evidence. Full fictional photo libraries and 3D assets belong to task 05.",
        "Capture quality and angle correctness are reviewed by the professional. The app validates file decoding and size, but does not infer sharpness or promise reconstruction from six views.",
        "Earlier images remain in the private gallery when replacing or clearing a slot. Explicit removal purges dependent views/media; withdrawal purges all server-owned media. Original files selected from the user’s filesystem remain outside app control."
      ],
      "verification": [
        {
          "command": "mise exec go@1.26.0 -- go test ./...",
          "result": "PASS all packages, including required/optional labels, incomplete and complete sets, replacement/history, stale conflicts, corrupt-file rejection, studio isolation, restart, withdrawal and client cascade deletion."
        },
        {
          "command": "mise exec go@1.26.0 -- go test -race ./internal/app",
          "result": "PASS 2.251s, privacy/consultation/photo workflows."
        },
        {
          "command": "mise exec go@1.26.0 -- go test golang.org/x/image/webp",
          "result": "PASS 0.072s: pinned decoder’s format regression tests. License text verified from downloaded tagged module; package version verified via official Go module proxy."
        },
        {
          "command": "npm --prefix web run build",
          "result": "PASS 172 modules, 403.46 kB JS / 127.42 kB gzip after final UI fixes."
        },
        {
          "command": "python scripts/verify-local-photos.py",
          "result": "PASS live eight-slot labels, missing-view counts, replacement retaining originals, corrupt/unsupported file failures, stale/duplicate conflicts, clear/reassign, reload, dependent deletion, withdrawal and no recreation."
        },
        {
          "command": "python scripts/verify-local-privacy.py; python scripts/verify-local-consultations.py",
          "result": "PASS regression workflows with valid generated PNG fixture and mandated demo account; disposable records deleted."
        },
        {
          "command": "In-app Browser: linked set, preview, upload, reload, invalid file, replacement, clear and reassign",
          "result": "PASS 0/6 incomplete state, 1/6 saved state after reload, visible unsupported file error, original and replacement retained. Existing-photo numbers now consistent with source gallery."
        },
        {
          "command": "In-app Browser plus CLI: withdraw while unsaved preview is open",
          "result": "PASS two stored diagnostic images erased. Before reload: preview images 0, slot images 0, all eight upload inputs disabled, missing state 0/6. Reload preserved withdrawn/empty state."
        },
        {
          "command": "Final npm --prefix web run build after permission-error guard",
          "result": "PASS TypeScript/Vite with permission gating and grouped notice condition; permission-error guard inspected in source. Browser withdrawal branch verified separately."
        },
        {
          "command": "Portable log image validation",
          "result": "PASS every retained image exists and loads via its relative asset URL."
        }
      ],
      "pictures": [
        {
          "src": "assets/guided-upload-empty.png",
          "caption": "Empty six-view set with external capture guide and optional detail slots. Upload blocked until fictional client acknowledgement.",
          "date": "2026-09-29T22:46:16-03:00"
        },
        {
          "src": "assets/guided-upload-review.png",
          "caption": "Intermediate review before upload. The green square is a diagnostic fixture, not a client portrait.",
          "date": "2026-09-29T22:46:16-03:00"
        },
        {
          "src": "assets/guided-upload-invalid.png",
          "caption": "Unsupported text-file rejection while the saved front view remains intact. Diagnostic image only.",
          "date": "2026-09-29T22:46:16-03:00"
        },
        {
          "src": "assets/guided-upload-retained.png",
          "caption": "Retained original selected again after replacement and clear/reassign. Both diagnostic square images remain in private gallery.",
          "date": "2026-09-29T22:46:16-03:00"
        },
        {
          "src": "assets/guided-upload-withdrawn.png",
          "caption": "Final withdrawal state: no stored images or open preview, all six main views missing and uploads disabled. Consultation history remains.",
          "date": "2026-09-29T22:46:16-03:00"
        }
      ],
      "commits": [
        "c5dd386930eb31a87dc38ec4c426bc1ee8a8a3bc"
      ],
      "outputs": [
        {
          "href": "assets/image-decoder-provenance.json",
          "label": "WebP decoder source, pinned version, license notice and attribution requirements"
        }
      ],
      "events": [
        {
          "date": "2026-09-29T22:27:02-03:00",
          "text": "Beginning guided photo-set uploads. Incomplete six-view sets remain usable and explicitly labeled; no dense-capture experiment is implied."
        },
        {
          "date": "2026-09-29T22:37:47-03:00",
          "text": "Full PNG/JPEG/WebP decoding now rejects corrupted files. The older privacy CLI fixture failed HTTP 400 due to malformed PNG bytes, revealing a fixture problem previously hidden by header-only checks. Replaced it with a valid generated colored diagnostic square, cleaned the disposable failed record and reran the full privacy workflow successfully."
        },
        {
          "date": "2026-09-29T22:46:16-03:00",
          "text": "Browser workflow fixes verified: consistent existing-photo numbering, focused review panel, revoked object URLs on withdrawal, and progression images hidden without active permission."
        },
        {
          "date": "2026-09-29T22:46:16-03:00",
          "text": "Task 04 technical acceptance verified locally. Professional capture review and actual reconstruction remain pending."
        }
      ]
    },
    {
      "id": "05",
      "title": "Shared representative assets and fictional clients",
      "depends": [
        "01",
        "04"
      ],
      "requirement": "Create commercially usable reusable 3D styles and coherent synthetic six-view demo clients.",
      "criteria": [
        "Distinct real hair/beard meshes, materials and consistent mannequin renders exist with structured provenance.",
        "Synthetic identity consistent across views; synthetic inputs and simulated visits labeled.",
        "Interchange, independent selection, keep-current and clean-shaven tested; private outputs excluded from Git."
      ],
      "status": "verified",
      "changes": [
        "Acquired exact FLAME 2023 Open archive through user-authenticated in-app browser after explicit agreement acceptance. Extracted in private ignored model storage with file permissions 0600; retained SHA-256 and commercial license provenance.",
        "Pinned MPFB source loaded offline inside private BLENDER_USER_RESOURCES. Created reproducible acquisition/render scripts; first neutral mannequin render underway.",
        "Core CC0 MakeHuman pack acquired and CRC verified (280,737,770 bytes). Pinned archive SHA-256 b542127a8e25547c7c29c19f2d1d2adb9a664c80396ecd694095dbc8028a0107; per-asset license and author metadata retained. Added real eyes and replaced uneven torso trim with planar cut and cap.",
        "Generated rounded natural coils as solid reusable helical strands and five independent beard meshes sampled from the visible face. Corrected half-quad sampling and applied smooth point-level beard boundaries. Eleven hair and five beard GLBs retained privately; metadata and renders available for review.",
        "Populated three synthetic identities through local authenticated API: required goals and maintenance, reusable intake, nine complete photo sets and 72 retained labeled renders. Expected and follow-up labels explicitly state simulation. Importer stores private progress and refuses automatic restoration after erasure or withdrawal."
      ],
      "limitations": [
        "Representative asset creation is verified in native Blender and the photo workflow. App 3D selectors, browser model performance and all eight route-specific compatibility checks remain separate pending implementation tasks.",
        "Catalog currently contains eleven hair and five beard assets. Ample catalog expansion remains task 15; approximately 40/20 are planning targets. Professional acceptance and final route choice remain pending.",
        "Smooth synthetic portraits and simulated follow-up images demonstrate workflow, not real reconstruction likeness or actual haircut accuracy. Ground-truth synthetic meshes are excluded from candidate inputs.",
        "Optional Blender MeshOptimizer library is unavailable; uncompressed GLB export/import passed. Existing multi-texture sampler warning needs browser evaluation in the shared workspace."
      ],
      "verification": [
        {
          "command": "ZipFile.testzip and SHA-256",
          "result": "Passed: 47,586,229-byte FLAME2023Open.zip, SHA-256 a6b4c3dc15d569d98136a1e548b6fe532eb2830ca12a4f0d4b3a5dba8ee87a91; exact flame2023_Open.pkl present."
        },
        {
          "command": "MPFB v2.0.17 in isolated Blender 5.2.1 profile",
          "result": "Initial extension setup failed on renamed operator arguments; corrected to custom_directory with LOCAL repository. Rerun passed and generated 19,158-vertex base human with 18,486 polygons in private smoke.blend."
        },
        {
          "command": "Offline Blender render.py neutral mannequin export",
          "result": "Created real normalized GLB: 4,913 head vertices / 4,869 polygons plus independent eye mesh. Front render visually inspected. Exporter reports unavailable optional MeshOptimizer library; uncompressed GLB export succeeds. Multi-image sampler warning remains for eye material; browser verification pending."
        },
        {
          "command": "Procedural beard render inspection",
          "result": "Five independent real GLB meshes exported, but stubble and moustache coverage reaches too high near the nose. Marked intermediate failure; correcting lip landmark and sampling boundaries before asset verification."
        },
        {
          "command": "Fictional Alex baseline render visual check",
          "result": "Failed intermediate appearance check: half-quad strand sampling left unnatural triangular gaps. No demo case imported into app yet; all outputs remain private and replaceable."
        },
        {
          "command": "Offline Blender verify-interchange.py initial run",
          "result": "16 style GLBs imported with finite geometry, metre-scale bounds and materials. Independent beard changes preserved hair fingerprint. Clean-shaven retained current hair. Selection saved to .blend and reopened with the same four meshes. Repeat underway for refined beard geometry."
        },
        {
          "command": "Measured refined beard render run",
          "result": "22.197 seconds wall time, 243.518 CPU seconds, peak child RSS 1,551,012 KiB. Cycles CPU 32 samples, 768 x 896. Total private asset workspace at measurement 256,611,460 bytes; includes retained intermediate scenes and client renders."
        },
        {
          "command": "Offline Blender verify-interchange.py refined run",
          "result": "Passed all 16 current style GLB imports. Hair fingerprint identical after beard switch and clean-shaven; saved selection reopened with four meshes. Candidate-specific clipping, app browser load and browser performance still pending."
        },
        {
          "command": "populate.py then second populate.py run",
          "result": "Passed: all 72 content hashes matched retained originals on second run, all nine sets reopened with eight labels and zero missing required views. No duplicated clients or photos on repeat."
        },
        {
          "command": "verify-import-guards.py against live local API",
          "result": "Passed actual disposable media erasure, permission withdrawal and client erasure. Each subsequent importer run failed explicitly; client lists unchanged, erased media absent, retained demo cases untouched."
        },
        {
          "command": "In-app browser Maya baseline and reload",
          "result": "Baseline selector displayed six coherent main views plus optional details. Reload retained three sets and eight loaded 768-pixel images. First DOM check used incorrect class selector and found zero matches; inspected source and corrected to actual #guided-photos ID. No app loading defect observed."
        },
        {
          "command": "Three-case measured rendering",
          "result": "Passed: 244.843 seconds wall time, 2,998.161 CPU seconds, peak child RSS 1,683,828 KiB; 72 renders at 768 x 896, Cycles CPU 32 samples. Private asset workspace including source scene outputs: 371,935,155 bytes."
        },
        {
          "command": "go test ./... and npm --prefix web run build",
          "result": "Passed Go suite (cached unchanged app source) and TypeScript/Vite production build. Asset scripts compile, native GLB checks and live synthetic persistence/refusal flows passed."
        }
      ],
      "pictures": [
        {
          "src": "assets/flame-open-license.png",
          "caption": "Exact Open model agreement inspected before user accepted download. Academic model and texture licenses are separate.",
          "date": "2026-09-29T23:02:05-03:00"
        },
        {
          "src": "assets/mannequin-intermediate.png",
          "caption": "Intermediate synthetic clay mannequin with real eye geometry. Hairstyle and beard libraries and cross-route compatibility remain in progress.",
          "date": "2026-09-29T23:08:44-03:00"
        },
        {
          "src": "assets/beard-placement-intermediate.png",
          "caption": "Rejected intermediate beard placement. Synthetic mannequin, left to right: stubble, full, goatee, moustache, chinstrap. Upper-face coverage requires correction; these are not accepted catalog outputs.",
          "date": "2026-09-29T23:12:34-03:00"
        },
        {
          "src": "assets/coily-mannequin.png",
          "caption": "Locally generated reusable rounded coil geometry on the shared synthetic mannequin. Professional acceptance pending.",
          "date": "2026-09-29T23:24:06-03:00"
        },
        {
          "src": "assets/beard-stubble-refined.png",
          "caption": "Stubble after sampling complete polygons and applying point-level boundaries. Independent real mesh; professional acceptance pending.",
          "date": "2026-09-29T23:24:06-03:00"
        },
        {
          "src": "assets/synthetic-case-browser.png",
          "caption": "Maya synthetic baseline in running local app with six coherent labeled views; captures and expected/follow-up sets are explicitly synthetic or simulated.",
          "date": "2026-09-29T23:30:17-03:00"
        }
      ],
      "commits": [
        "2b529a7d014b399e700e6e6916c94a8d6b3e85ba"
      ],
      "outputs": [
        {
          "href": "assets/flame-open-provenance.json",
          "label": "FLAME 2023 Open acquisition and license provenance"
        },
        {
          "href": "assets/makehuman-core-provenance.json",
          "label": "Core MakeHuman and MPFB license and acquisition metadata"
        },
        {
          "href": "assets/representative-asset-metadata.json",
          "label": "Representative hair/beard mesh metadata, licenses, filters and limitations"
        },
        {
          "href": "assets/asset-interchange-results.json",
          "label": "Actual GLB import, independent selection and saved reopen results"
        },
        {
          "href": "assets/synthetic-cases-provenance.json",
          "label": "Fictional case histories, view labels, generation licenses and limitations"
        },
        {
          "href": "assets/asset-resource-results.json",
          "label": "Measured rendering settings, wall time, CPU use, memory and retained sizes"
        }
      ],
      "events": [
        {
          "date": "2026-09-29T22:52:20-03:00",
          "text": "Starting shared asset acquisition and creation. Current colored squares are diagnostics only and will not be used as portrait inputs or 3D accuracy evidence."
        },
        {
          "date": "2026-09-29T23:02:05-03:00",
          "text": "User accepted FLAME 2023 Open terms. Download prerequisite satisfied; loading and fitting are not yet verified."
        },
        {
          "date": "2026-09-29T23:06:00-03:00",
          "text": "Official sample asset-pack URL returned 404; located current official /assets/assetpacks page. Core CC0 asset pack downloading; no third-party assets treated as automatically CC0."
        },
        {
          "date": "2026-09-29T23:08:44-03:00",
          "text": "Ten core hairstyle meshes now being fitted, exported and rendered on the same shared mannequin. Tile labels and appearance still require inspection."
        },
        {
          "date": "2026-09-29T23:17:36-03:00",
          "text": "Fictional-case rendering paused after inspection found triangular bare patches in beard coverage. Cause: strands sampled only the first triangle of each quad. Corrected to area-weighted sampling across the complete polygon fan; rerendering catalog before rebuilding cases."
        },
        {
          "date": "2026-09-29T23:31:09-03:00",
          "text": "Verified representative asset milestone, not completion of 3D product features or comparative candidates. Preserving all remaining requirements and professional review as pending."
        }
      ]
    },
    {
      "id": "06",
      "title": "Persistent shared comparison workspace",
      "depends": [
        "05"
      ],
      "requirement": "Shared candidate selector, job states and synchronized current/proposed viewer.",
      "criteria": [
        "All eight candidates remain selectable with inputs, settings, status, outputs and evidence.",
        "Real processing jobs, cancellation, failure and restart/reopen behavior; no canned success.",
        "Synchronized rotation/zoom and consistent named angles; independent styles and option persistence."
      ],
      "status": "verified",
      "changes": [
        "Implemented shared authenticated library, optimistic workspace persistence, immutable explored mannequin options and six-view input-check jobs. Candidate-specific head processing remains pending.",
        "Saved workspace/options now snapshot owned photo assignments. Replacing a live view preserves earlier explorations; erasing an old snapshot source clears dependent options, workspace and jobs without deleting the replacement.",
        "Centered the generic mannequin camera and increased default/reset distance to 1.3 m after rounded coils touched the top of the closer viewport. Added mobile navigation access to demos and complete Portuguese labels for the new controls.",
        "Verified the shared workspace foundation. All eight candidates are selectable; three fictional cases each retain actual six-photo diagnostics and a saved independent mannequin exploration. Full candidate processing and complete journeys remain explicitly pending in their separate tasks.",
        "Code-split Three.js/demo UI so normal client pages retain a 414.71 kB entry bundle; viewer code loads when opening demos. Default/reset mannequin framing is centered at 1.3 m."
      ],
      "limitations": [
        "Candidate-specific fitting/reconstruction, client-specific geometry, direct editing, expected-result selections and full comparative demos remain pending in tasks 07a-14a, 16, 17 and full candidate checks 07-14.",
        "Representative catalog is 11 hairstyles and 5 beardstyles. Expanded variety and natural beard edge refinement remain in task 15; professional acceptance is pending.",
        "Uncompressed assets total 91 MB for the 16 styles; dense beards can exceed 210k triangles. Initial frame rates are short local observations, not sustained performance guarantees. Deferred Three.js bundle retains the Vite size warning.",
        "In-app viewport override did not apply; desktop browser behavior is verified, narrow-screen behavior is not yet verified. One old QuillBot extension console error was observed; no application error was observed during these viewer checks."
      ],
      "verification": [
        {
          "command": "go test ./internal/app -run Demo -count=1",
          "result": "Passed: persistence, access, decoding failure, cancellation, restart interruption, non-front erasure and late-publication guards."
        },
        {
          "command": "go test -race ./internal/app -run 'Demo|Privacy|Permission|Guided' -count=1",
          "result": "Passed under race detector."
        },
        {
          "command": "python3 scripts/verify-local-demos.py",
          "result": "Passed on running loopback app: read 91,075,372 bytes of 16 real GLBs; verified six metrics, identical-image warnings, snapshot replacement/reopen, conflict, non-front erasure, cancellation, withdrawal and fixture cleanup."
        },
        {
          "command": "go test ./...",
          "result": "Passed for all packages after shared demo changes."
        },
        {
          "command": "go test -race ./internal/app -run Demo -count=1",
          "result": "Passed for all demo tests, including original snapshot erasure after later replacement."
        },
        {
          "command": "npm --prefix web run build",
          "result": "Passed: 181 modules; entry 414.71 kB (131.74 kB gzip), deferred demos 659.05 kB (167.72 kB gzip). Vite still warns about the deferred Three.js chunk over 500 kB."
        },
        {
          "command": "@Browser shared workspace flow",
          "result": "All 16 real style GLBs loaded without app alerts. Named angle and zoom controls produced identical actual cameras. Keep-current, independent beard, clean-shaven, filters, saved option reopen and reload passed. All eight selectors passed; supporting dependencies explicitly labeled. Withdrawn client rendered zero input photos and zero canvases."
        },
        {
          "command": "python3 scripts/demo-assets/populate-workspaces.py",
          "result": "24 retained real input checks, six original source views each; 24 saved mannequin options; no candidate head processing claimed. Known removed assets/options are refused rather than recreated."
        },
        {
          "command": "go test -race ./internal/app -run Demo -count=1",
          "result": "Passed after adding queued-restart verification: queued jobs resume with original inputs; interrupted running jobs become failed; completed work reopens."
        },
        {
          "command": "python3 scripts/demo-assets/populate-workspaces.py (second run)",
          "result": "Passed without creating extra jobs/options or changing saved workspace. All 24 stored input checks and original source IDs verified again."
        },
        {
          "command": "Portable HTML log: local file references plus loopback HTTP and @Browser selector",
          "result": "41 relative picture/output links exist and returned HTTP 200. Full browser reload and selector showed the current six verified milestones and all added processing/full-demo tasks."
        },
        {
          "command": "npm --prefix web run build (final formatted source)",
          "result": "Passed: entry 414.71 kB (131.73 kB gzip), deferred demos 659.07 kB (167.73 kB gzip), 181 modules, 1.44 s. Deferred Three.js chunk warning remains."
        }
      ],
      "pictures": [
        {
          "src": "assets/demo-workspace-intermediate.png",
          "caption": "2026-09-30: all eight selectors, six coherent Maya inputs, synchronized real GLB inspection and actual input job running. Head geometry is explicitly generic, not a client reconstruction.",
          "date": "2026-09-30T00:09:03-03:00"
        },
        {
          "src": "assets/demo-independent-styles.png",
          "caption": "2026-09-30: actual rounded-coil GLB in both views, independent goatee only in proposal, synchronized front angle and 1.09 m zoom. Both actual camera measurements agree. Beard silhouette refinement and professional acceptance remain pending.",
          "date": "2026-09-30T00:16:36-03:00"
        },
        {
          "src": "assets/demo-portuguese-framing.png",
          "caption": "2026-09-30: Portuguese synchronized viewer with corrected default framing and ample room above the rounded coils. This capture is desktop width; the attempted viewport override did not apply.",
          "date": "2026-09-30T00:28:45-03:00"
        },
        {
          "src": "assets/demo-support-dependency.png",
          "caption": "2026-09-30: CloudCompare selector explicitly identifies its required upstream reconstruction/fitting dependency and pending candidate stage.",
          "date": "2026-09-30T00:28:45-03:00"
        },
        {
          "src": "assets/demo-withdrawn-client.png",
          "caption": "2026-09-30: withdrawn baseline client cannot open private demo inputs or saved work. DOM check: zero input images and zero 3D canvases.",
          "date": "2026-09-30T00:40:35-03:00"
        },
        {
          "src": "assets/demo-input-verification.png",
          "caption": "2026-09-30: actual 768x896 six-view metrics, hashes and completed retained report. An additional input check is running asynchronously; neither is presented as reconstruction.",
          "date": "2026-09-30T00:40:35-03:00"
        }
      ],
      "commits": [
        "81ba3ea"
      ],
      "outputs": [
        {
          "href": "assets/three-provenance.json",
          "label": "Three.js and type definitions: pinned versions and full MIT notices"
        },
        {
          "href": "assets/browser-asset-checks.json",
          "label": "Actual browser load/mesh counts/bytes/initial frame rates for 11 hairstyles and 5 beards"
        },
        {
          "href": "assets/browser-candidate-checks.json",
          "label": "All eight selector checks, including explicit upstream dependencies for supporting components"
        },
        {
          "href": "assets/shared-demo-population-results.json",
          "label": "24 real shared six-input checks and preserved mannequin explorations; all candidate head processing remains pending"
        }
      ],
      "events": [
        {
          "date": "2026-09-29T23:32:01-03:00",
          "text": "Starting authenticated local comparative workspace. Shared assets and fictional baseline sets are ready; reconstruction/fitting routes remain distinct pending tasks. No route is presented as successful until it actually processes inputs."
        },
        {
          "date": "2026-09-30T00:09:03-03:00",
          "text": "First browser check: actual head and hair GLBs loaded in both WebGL scenes; shared neutral geometry visibly rendered. Input check progressed asynchronously. Styling, rotation, reload and deletion verification continues."
        },
        {
          "date": "2026-09-30T00:28:45-03:00",
          "text": "Browser viewport override requested 390x844 but the in-app browser remained 1658px wide. No mobile verification claim is made. Reset override. One English Language locator failed after changing to Portuguese; fresh DOM identified Idioma and verification continued."
        },
        {
          "date": "2026-09-30T00:40:35-03:00",
          "text": "Updated dependencies: native processing milestones precede shared direct editing/history, and complete candidate verification follows them. This removes the earlier circular dependency while retaining every approved full-demo requirement."
        },
        {
          "date": "2026-09-30T00:46:38-03:00",
          "text": "The browser log tab initially retained an older loaded page during hash-only navigation. A full reload and Task selector verified the current log; commit hashes remain local text, not broken remote links."
        }
      ]
    },
    {
      "id": "07a",
      "title": "Blender + MPFB processing experiment",
      "depends": [
        "06"
      ],
      "requirement": "Fit shared photos using actual MPFB, explicit cameras, landmarks and bounded render iterations. Retain actual processing success or failure; the full candidate journey remains in task 07.",
      "criteria": [
        "Exact software, model and asset licenses verified separately against primary sources.",
        "Runnable local six-photo processing with real status, cancellation, retained settings, outputs and reload; successful head geometry loads with independent shared assets.",
        "Observed, fitted and hidden inferred geometry distinguished; iterations, resource use, sizes, coverage, likeness/clipping limitations and failures retained. No fallback counted as candidate success.",
        "This processing milestone does not mark editing, expected selections, complete demos or professional acceptance complete."
      ],
      "status": "verified",
      "changes": [
        "Actual offline MPFB target fitting script now reads six input photos, detects image-plane landmarks, optimizes bounded facial targets and exports a separate fitted head plus 11 hair and five beard meshes.",
        "Native job integration queues real processing, retains camera assumptions and diagnostic files, snapshots all six source dependencies, and serves artifacts only to the authorized studio with active permission.",
        "All three fictional cases now have real, distinct MPFB fitted heads and saved independent-style explorations. Repeated seeding retains the same job/option IDs and does not overwrite current workspace selections.",
        "Processing uses kernel network isolation, a private process group, parent-death protection for runner and native stages, and an OS thread held for the child lifetime. Both direct fitting CLIs and the API enforce network isolation."
      ],
      "limitations": [
        "First synthetic-only probe matched 56 landmarks in front and two three-quarter views; both profiles and back had no paired detections. Entire 3D surface remains a fitted or inferred MPFB prior. Pixel error does not prove likeness.",
        "Initial synthetic-only CLI probe preceded network isolation. MediaPipe 1.0.1 NOTICE describes utilization metrics; integrated app processing now uses an isolated Linux network namespace.",
        "Alex and Maya used 56 paired landmarks in three views; Noah used 37 in two views. Both profile views and back remain unobserved by this face detector. The fitted heads visibly retain strong generic-prior influence; likeness remains unverified.",
        "No texture likeness is fitted. Hair and beard references remain manually chosen. Goatee boundaries and dense stubble still need catalog-quality refinement. Full editing, expected-result selection/revision history and complete candidate demos remain pending in their existing tasks.",
        "Peak RSS is the cumulative maximum child-process memory through each stage, not isolated stage memory. Landmark pixel error is after framing translation and fixed neutral correspondence offsets; neither metric establishes likeness.",
        "Later task 10a investigation found that the original optimization basis omitted target unit/axis conversion. Historical outputs are retained, with a corrected and reverified implementation required in task 07b. Previous technical evidence does not establish correct target optimization."
      ],
      "verification": [
        {
          "command": "Initial retained mpfb-alex-six experiment",
          "result": "Prepare 24.090 s, fit 2.501 s, export 26.966 s; 53.560 s total; 107758627 retained bytes; 97 evaluations across four iterations; mean image landmark error 2.770 pixels; all native stages exited 0."
        },
        {
          "command": "go test ./... first native integration attempt",
          "result": "Failed: persisted default camera settings changed the expected test fixture. Corrected fixture to explicitly include the saved defaults; subsequent full suite passed."
        },
        {
          "command": "Native subprocess erasure test first attempt",
          "result": "Failed HTTP 400 because the test omitted the required confirmed deletion body. Corrected the test and verified whole-process-group termination before directory purge; no directory recreation."
        },
        {
          "command": "go test ./... after corrections",
          "result": "Passed all packages, including native validation, rejecting diagnostics as heads, and killing a real writing subprocess when a non-front input is erased."
        },
        {
          "command": "npm --prefix web run build intermediate native UI edit",
          "result": "Failed: the fitted catalog prop was missing its TypeScript declaration. Added the declaration, retained existing formatting, and rebuilt successfully."
        },
        {
          "command": "Native verification immediately after server restart",
          "result": "First request was refused before Go compilation finished. Waited for HTTP health readiness before retrying."
        },
        {
          "command": "Native verification with multiple completed fits",
          "result": "Initial test incorrectly expected the newest run to replace the saved selection. Corrected verification to inspect the retained chosen run; the app correctly preserved its earlier selection."
        },
        {
          "command": "Full final MPFB pipeline with network and parent-death safeguards",
          "result": "Completed in 51868 ms, 56 paired landmarks, 11 hair variants and five beard variants; repeated head.glb SHA256 identical to the previous fit of the same inputs."
        },
        {
          "command": "python scripts/native-demos/verify-parent-death.py",
          "result": "Passed: killing the launcher abruptly terminated the actual native runner and Blender stage; no app/client state changed."
        },
        {
          "command": "python scripts/native-demos/verify-local.py",
          "result": "Passed actual 17 fitted GLB reads, anonymous 401/unlisted path 404, fitted workspace and option reopening, actual no-face processing failure without fallback, live nonfront erasure during processing, no recreated directory, and withdrawal denial. Disposable fixture deleted."
        },
        {
          "command": "python scripts/native-demos/populate.py blender-mpfb, repeated",
          "result": "Passed three real synthetic fits and preserved previously retained job/option IDs. All eight full candidate journeys remain pending."
        },
        {
          "command": "python scripts/verify-local-demos.py",
          "result": "Passed existing shared-workspace and input diagnostics regression checks after native integration."
        },
        {
          "command": "go test ./... final native source",
          "result": "Passed all packages."
        },
        {
          "command": "go test -race ./internal/app (Native, Demo, Privacy and Permission)",
          "result": "Passed selected consequential behavior tests in 3.050 s."
        },
        {
          "command": "npm --prefix web run build final native UI",
          "result": "Passed 181 modules in 1.51 s; deferred demo chunk 665.40 KB with the existing size warning retained as a performance limitation."
        },
        {
          "command": "Final browser native workflow",
          "result": "All 11 hair and five beard mesh variants rendered on the actual fitted head; independent selection, synchronized front/profile camera, saved option reopening and workspace reload verified. Legacy options show declared 70 mm, 1.6 m, 0.04 m, four-round defaults. No app alert or new app console error; one earlier unrelated extension error remains in browser logs."
        },
        {
          "command": "Latest running API invalid setting boundary",
          "result": "Explicit zero focal length rejected HTTP 400 before native processing. Loopback service is running the latest source."
        },
        {
          "command": "Portable HTML log validation",
          "result": "All 55 then-linked relative pictures and retained outputs existed and returned HTTP 200; task selector and verified scoped entry loaded in the in-app browser. No model weights, source photo library, databases or credentials staged."
        }
      ],
      "pictures": [
        {
          "src": "assets/mpfb-running.png",
          "caption": "Actual MPFB process running at 5%; shared input checks are separately labeled.",
          "date": "2026-09-30T01:59:26-03:00"
        },
        {
          "src": "assets/mpfb-fitted-profile.png",
          "caption": "Synchronized profile inspection of the actual fitted head with independent current/proposed meshes; hidden surfaces remain inferred and beard boundaries need refinement.",
          "date": "2026-09-30T01:59:26-03:00"
        },
        {
          "src": "assets/mpfb-six-view-evaluation.png",
          "caption": "Six synthetic input views beside untextured fitted geometry. Three views supplied paired landmarks; both profiles and back did not. This is not real-person reconstruction accuracy or haircut evidence.",
          "date": "2026-09-30T01:59:26-03:00"
        },
        {
          "src": "assets/mpfb-final-front.png",
          "caption": "Final browser view of the retained synthetic Alex fitted head with independently refitted current/proposed hair and beard; direct editing and expected-result selection remain pending.",
          "date": "2026-09-30T02:01:57-03:00"
        },
        {
          "src": "assets/mpfb-final-evidence.png",
          "caption": "Completed actual six-view MPFB experiment with explicit fitted/inferred geometry labels, framing-aligned landmark error and retained diagnostic evidence.",
          "date": "2026-09-30T02:01:57-03:00"
        },
        {
          "src": "assets/mpfb-fitted-comparison.png",
          "caption": "Intermediate browser render of the actual fitted head and independent style meshes before the final labeling and viewport capture corrections. Final screenshots below provide the complete inspection view.",
          "date": "2026-09-30T02:03:53-03:00"
        }
      ],
      "commits": [
        "fec6ce29c8e26df44e9f90d73d9e49688ddef904"
      ],
      "outputs": [
        {
          "href": "assets/native-mpfb-provenance.json",
          "label": "Exact native runtime, model sources, hashes, licenses and bundled notices"
        },
        {
          "href": "assets/mpfb-fit-results.json",
          "label": "Three actual fit reports, coverage, resource use and distinct head hashes"
        },
        {
          "href": "assets/mpfb-populated-native-results.json",
          "label": "Retained fictional-case processing and saved option results"
        },
        {
          "href": "assets/mpfb-live-verification.json",
          "label": "Actual native API, failure, privacy and cancellation verification"
        },
        {
          "href": "assets/mpfb-browser-style-checks.json",
          "label": "Actual browser loading of all sixteen fitted style variants"
        },
        {
          "href": "assets/mpfb-parent-death-check.json",
          "label": "Abrupt-shutdown native process verification"
        },
        {
          "href": "assets/mpfb-final-pipeline-check.json",
          "label": "Reproduced final native processing settings and results"
        },
        {
          "href": "http://127.0.0.1:8080/demos?client=a0b730e5-490f-488d-ae16-4f3812ee044f",
          "label": "Reopen the retained fitted exploration in the local app"
        },
        {
          "href": "assets/makehuman-core-provenance.json",
          "label": "Exact Blender and MPFB versions, GPL code and separate CC0 core asset/target provenance"
        }
      ],
      "events": [
        {
          "date": "2026-09-30T00:28:45-03:00",
          "text": "Separated native processing from full-demo verification to remove the dependency cycle through common editing and expected-selection history. Original full journey requirements remain in task 07."
        },
        {
          "date": "2026-09-30T00:47:04-03:00",
          "text": "Beginning actual MPFB six-photo fitting with explicit cameras/landmarks and bounded iterations. Shared mannequin asset generation from task 05 is not counted as a client fit. Full demo verification remains pending in task 07 after direct editing and expected-selection history."
        },
        {
          "date": "2026-09-30T01:29:32-03:00",
          "text": "Native workflow implemented; app/browser verification and local milestone commit remain pending."
        },
        {
          "date": "2026-09-30T02:01:57-03:00",
          "text": "Native experiment technical checks passed. Professional likeness/style assessment and the full candidate journey remain pending."
        },
        {
          "date": "2026-09-30T02:02:34-03:00",
          "text": "Verified the scoped native processing experiment. Full Blender demo task 07 stays pending until client editing, expected-result history and complete journey verification are delivered."
        },
        {
          "date": "2026-09-30T02:04:10-03:00",
          "text": "Local verified milestone committed as fec6ce29c8e26df44e9f90d73d9e49688ddef904; no push or deployment."
        },
        {
          "date": "2026-09-30T06:51:45.261508+00:00",
          "text": "Coordinate-basis regression discovered through independent native MakeHuman comparison; task 07b now repairs and verifies actual deformation against its optimization basis."
        }
      ]
    },
    {
      "id": "07b",
      "title": "Repair MPFB target units and verify actual applied geometry",
      "depends": [
        "07a"
      ],
      "requirement": "Correct the discovered target coordinate-basis error before native comparison milestones advance. Preserve historical options and selection history; label their limitation.",
      "criteria": [
        "Convert raw MakeHuman target offsets from decimetres and Y up to the exported head metres and Z up, including crown recentering.",
        "Every corrected completed MPFB experiment checks predicted target geometry against actual MPFB-applied vertices and retains the measured error.",
        "Run corrected six-photo cases, actual native fitting/failure/privacy checks, app checks and browser inspection. Retain original experiments and clearly flag their basis limitation."
      ],
      "status": "verified",
      "changes": [
        "Corrected raw CC0 target offsets from native MakeHuman X/Y/Z decimetres into MPFB X/-Z/Y metres and included the actual crown recentering translation. Each export now directly compares its optimization-basis prediction with actual MPFB-evaluated target vertices, refusing completion above 10 micrometres of error.",
        "Corrected fitting has the explicit mpfb-metre-z-up-v2 basis version. Historical jobs and options remain retained and receive a visible limitation notice; new corrected population uses a separate checkpoint and new options, preserving prior history."
      ],
      "limitations": [
        "Historical MPFB fitted experiments lack the corrected basis and must not be counted as corrected fitting evidence. Professional likeness remains pending."
      ],
      "verification": [
        {
          "command": "Source coordinate inspection",
          "result": "MPFB TargetService._target_string_to_shape_key_info rotates X/Y/Z to X/-Z/Y; _set_shape_key_coords_from_dict multiplies by the human scale factor. Native source and the generated basis confirmed the missing conversion in the earlier experiment."
        },
        {
          "command": "Corrected native failure, artifact access, persistence and erasure verification",
          "result": "Passed against actual corrected Alex head e90fa4b1-492c-4b76-af70-dd96257bdb84. All 17 fitted artifacts read; chosen option persisted/reloaded; original current exploration restored; no-face fitting failed without a head; deletion cancelled real native processing and purged outputs; withdrawal denied earlier diagnostics."
        },
        {
          "command": "Corrupted MPFB basis rejection experiment",
          "result": "Passed: injected 20 mm prediction offset produced a failed direct native check, nonzero Blender exit and no exported head. All three positive checks measured 0.12 to 0.17 micrometres maximum error against actual MPFB application."
        },
        {
          "command": "Exact staged-index go test ./...",
          "result": "Passed independently in the exported staged checkout, including internal/app in 0.701 s."
        },
        {
          "command": "Exact staged-index npm --prefix web run build",
          "result": "Passed after correcting the staging-only JSX extraction. Demo chunk remains about 670 kB with the existing size warning."
        },
        {
          "command": "go test -race ./internal/app -run Native/Demo/Colmap/Privacy/Permission",
          "result": "Passed in the working app in 3.255 s."
        },
        {
          "command": "Browser corrected MPFB inspection",
          "result": "All 16 actual fitted styles loaded against the corrected Alex job. Corrected option saved; historical outputs display the explicit units/axes limitation. Reload and exact-staged-source native repeat are in progress."
        },
        {
          "command": "Browser-queued exact-staged-source MPFB repeat",
          "result": "Passed: completed native run 1a6726d4-004a-499c-bbd9-8721a1f3308a produced a byte-identical head to corrected Alex e90fa4b1-492c-4b76-af70-dd96257bdb84. Actual applied target check passed; saving and reload retained the corrected option and did not choose the new run automatically."
        },
        {
          "command": "Local progress-log link verification",
          "result": "75 relative pictures/outputs loaded with HTTP 200 before adding the final repeat evidence links. One authenticated local app link is intentionally separate from portable assets. The first audit incorrectly treated that app URL as a relative file and failed; corrected classification passed."
        }
      ],
      "pictures": [
        {
          "src": "assets/mpfb-historical-basis-notice.png",
          "caption": "2026-09-30: original MPFB experiment retained with an explicit warning about its incorrect optimization units and axes; history is preserved.",
          "date": "2026-09-30T04:09:01-03:00"
        },
        {
          "src": "assets/mpfb-corrected-comparison.png",
          "caption": "2026-09-30: actual corrected MPFB head with independently refitted current and proposed hair/beard meshes; synthetic input and professional likeness review remains pending.",
          "date": "2026-09-30T04:09:01-03:00"
        },
        {
          "src": "assets/mpfb-corrected-native-validation.png",
          "caption": "2026-09-30: native repeat using the exact staged source completed; 4,701 directly checked vertices differ by at most 0.17 micrometres from the optimizer prediction. This verifies target application, not likeness.",
          "date": "2026-09-30T04:11:04-03:00"
        }
      ],
      "commits": [
        "ef786c1"
      ],
      "outputs": [
        {
          "href": "assets/mpfb-corrected-basis-verification.json",
          "label": "Actual target application checks for three cases and deliberate corruption rejection"
        },
        {
          "href": "assets/mpfb-corrected-live-verification.json",
          "label": "Corrected head authorization, persistence, failure, cancellation and erasure checks"
        },
        {
          "href": "assets/mpfb-populated-corrected-results.json",
          "label": "Three retained corrected MPFB experiments and populated explored options"
        },
        {
          "href": "assets/mpfb-corrected-browser-style-checks.json",
          "label": "All 16 corrected fitted styles loaded in the browser"
        },
        {
          "href": "assets/mpfb-corrected-staged-repeat.json",
          "label": "Exact staged-source browser repeat, actual target checks and repeat head checksum"
        }
      ],
      "events": [
        {
          "date": "2026-09-30T06:51:45.261508+00:00",
          "text": "Begin focused dependency repair; task 10a is paused pending this verified local milestone."
        },
        {
          "date": "2026-09-30T03:54:14-03:00",
          "text": "Corrected three-case native reruns are in progress. Current MakeHuman task 10a remains pending until this dependency repair is verified and committed."
        },
        {
          "date": "2026-09-30T03:57:46-03:00",
          "text": "All three corrected MPFB runs completed, preserving original jobs/options. Direct prediction-versus-native application passed with sub-micrometre vertex errors. During shared verifier generalization, its old fixed output path overwrote the previous evidence JSON. The corrected run evidence was retained under mpfb-corrected-live-verification.json, the original committed evidence restored, and output paths are now candidate-specific. The MakeHuman verifier will run again for its own retained evidence after this repair milestone."
        },
        {
          "date": "2026-09-30T04:05:01-03:00",
          "text": "The focused repair is staged separately from paused MakeHuman app code. An exported copy of exactly the staged index caught a truncated JSX insertion in the staging script, while the working app source remained valid. The staged insertion was corrected; this exact-index frontend and Go verification is being rerun before committing."
        },
        {
          "date": "2026-09-30T04:11:04-03:00",
          "text": "Dependency repair is technically verified. The current fictional Alex browser fixture opens its corrected MPFB option after QA; all original experiments/options remain retained with visible limitations. This is a reversible inspection state, not professional acceptance or a final route selection. MakeHuman 10a remains pending until the repair commit is made."
        },
        {
          "date": "2026-09-30T04:12:06-03:00",
          "text": "Local repair milestone committed as ef786c1; no push or deployment. Proceeding back to MakeHuman after the dependency repair."
        }
      ]
    },
    {
      "id": "08a",
      "title": "COLMAP / PyCOLMAP processing experiment",
      "depends": [
        "06"
      ],
      "requirement": "Reconstruct the agreed six photos through real COLMAP processing. Retain actual processing success or failure; the full candidate journey remains in task 08.",
      "criteria": [
        "Exact software, model and asset licenses verified separately against primary sources.",
        "Runnable local six-photo processing with real status, cancellation, retained settings, outputs and reload; successful head geometry loads with independent shared assets.",
        "Observed, fitted and hidden inferred geometry distinguished; iterations, resource use, sizes, coverage, likeness/clipping limitations and failures retained. No fallback counted as candidate success.",
        "This processing milestone does not mark editing, expected selections, complete demos or professional acceptance complete."
      ],
      "status": "failed",
      "changes": [
        "Installed official PyCOLMAP 4.2.1 CPU wheel privately with retained BSD-3-Clause notice and registry distribution hashes. SIFT uses no learned model.",
        "Added a real isolated COLMAP route: six copied source snapshots, CPU SIFT, exhaustive geometric matching, three bounded sparse mapping trials, native database retention and actual verified-match graph. Standard and sensitive declared-calibration presets are persisted."
      ],
      "limitations": [
        "All six retained case/preset experiments and the browser repeat produced zero sparse models. The COLMAP route failed the head coverage and editable-head requirements on these synthetic six-view inputs. This does not establish failure on every real-person capture.",
        "Dense reconstruction was not run because no sparse model was available. The available RTX 4050 was not used; installing the separate CUDA runtime would require its own license acceptance if a later sparse reconstruction makes dense evaluation meaningful.",
        "No native head exists for compatible style fitting, clipping or 3D browser-performance measurement. Generic mannequin inspection remains explicitly separate and is not counted as candidate success. Current-hair/beard separation, refinement, expected selection and the full task 08 journey are unmet.",
        "Declared calibration assumes shared 36 mm sensor, square pixels, centered principal point and no distortion. It is not measured calibration. Synthetic clay input texture and six-view overlap limit these results; no extra capture or ground-truth geometry was substituted.",
        "Feature counts were stable in the browser repeat; verified-match counts varied slightly despite the declared random seed. No bitwise repeatability or reconstructed likeness is claimed. Peak RSS is cumulative process memory, not isolated per-stage memory."
      ],
      "verification": [
        {
          "command": "Initial Alex standard and sensitive CLI experiments",
          "result": "Both extracted actual features and attempted all 15 pairs and three mapping trials. Neither retained a sparse model. Native databases and logs remain private."
        },
        {
          "command": "Initial go test ./... after adding COLMAP state",
          "result": "Failed workspace persistence fixture comparison because its expected state omitted the new default standard preset. Corrected fixture to include the documented default; rerun pending."
        },
        {
          "command": "go test ./...",
          "result": "Passed after normalizing the persistence fixture to the documented standard preset; internal/app completed in 0.764 seconds."
        },
        {
          "command": "mise exec go@1.26.0 -- go test -race ./internal/app -run 'Native|Demo|Colmap|Privacy|Permission'",
          "result": "Passed in 3.273 seconds. Includes real subprocess termination-before-purge, failed reconstruction publication, failed-head selection rejection and dependent erasure."
        },
        {
          "command": "npm --prefix web run build",
          "result": "Passed, 181 modules. Demos chunk 669.57 kB / 170.20 kB gzip, existing size warning remains. This is not a mobile performance measurement."
        },
        {
          "command": "python scripts/native-demos/populate.py colmap with both presets, then repeat",
          "result": "Three fictional clients times two presets, six real native experiments and eighteen mapping trials. All zero sparse models. Repeat reused retained failed runs without creating jobs or restoring removed material."
        },
        {
          "command": "python scripts/native-demos/verify-colmap.py",
          "result": "Passed twice. Latest check waited for actual SIFT extractor startup before deleting the back source. Process output vanished, result cleared, no directory recreation, private/anonymous artifact denial, actual PNG decode and withdrawal verified."
        },
        {
          "command": "Browser COLMAP selector, save workspace, reload and run reconstruction",
          "result": "Sensitive preset, focal length 70 mm and original six source assignments survived reload. Browser button started actual running job 3735c097-2b42-4132-9fba-266a435d02cd, then displayed native failure, true features, match graph and three zero-model trials."
        },
        {
          "command": "Source-image SHA-256 comparison against native MPFB runs",
          "result": "Every original six-photo source hash matched for all three cases in both presets. No denser capture, learned model, ground-truth mesh or case morph values used."
        },
        {
          "command": "Portable evidence HTTP and browser checks",
          "result": "All 64 relative retained pictures/output links exist and returned HTTP 200. Browser task selector renders task 08a as failed and shows the retained evidence. Restored Alex’s previously chosen MPFB model and original independent styles after testing COLMAP settings."
        },
        {
          "command": "HTML log updater after milestone",
          "result": "Whitespace in the JavaScript assignment broke the CLI parser during commit recording. Updated the parser to validate the assignment and parse its JSON independent of whitespace; actual commit recording succeeded."
        }
      ],
      "pictures": [
        {
          "src": "assets/colmap-controls.png",
          "caption": "2026-09-30: COLMAP selector and the six original synthetic views. The native reconstruction controls are below this viewport; shared mannequin inspection is not credited as COLMAP output.",
          "date": "2026-09-30T02:39:01-03:00"
        },
        {
          "src": "assets/colmap-failed-result.png",
          "caption": "2026-09-30: actual browser-started COLMAP failure, retained native evidence and explicit absence of a sparse model. Dense processing did not run because its sparse prerequisite failed.",
          "date": "2026-09-30T02:39:01-03:00"
        },
        {
          "src": "assets/colmap-match-graph-app.png",
          "caption": "2026-09-30: authenticated retained match graph loaded at 1200 by 820 pixels. Counts are verified feature matches, not measured surface coverage or likeness.",
          "date": "2026-09-30T02:39:01-03:00"
        }
      ],
      "commits": [
        "d2acc07a521e915bc4584dc991248539500aaa0f"
      ],
      "outputs": [
        {
          "href": "assets/colmap-provenance.json",
          "label": "Exact PyCOLMAP software license and acquisition provenance"
        },
        {
          "href": "assets/colmap-populated-standard.json",
          "label": "Three retained standard SIFT experiments"
        },
        {
          "href": "assets/colmap-populated-sensitive-calibrated.json",
          "label": "Three retained sensitive declared-calibration experiments"
        },
        {
          "href": "assets/colmap-shared-input-check.json",
          "label": "Source identity and six-run coverage comparison"
        },
        {
          "href": "assets/colmap-live-verification.json",
          "label": "Actual pipeline failure, artifact access and native erasure checks"
        }
      ],
      "events": [
        {
          "date": "2026-09-30T00:28:45-03:00",
          "text": "Separated native processing from full-demo verification to remove the dependency cycle through common editing and expected-selection history. Original full journey requirements remain in task 08."
        },
        {
          "date": "2026-09-30T02:04:11-03:00",
          "text": "Begin exact COLMAP/PyCOLMAP license and six-photo processing evaluation. No denser capture or fallback reconstruction will be counted as this route."
        },
        {
          "date": "2026-09-30T02:40:22-03:00",
          "text": "Complete retained native experiment milestone with technical checks passing and reconstruction requirements failed. Keep COLMAP available as a runnable candidate and preserve all failure evidence; professional route selection remains pending."
        }
      ]
    },
    {
      "id": "09a",
      "title": "Meshroom / AliceVision processing experiment",
      "depends": [
        "06"
      ],
      "requirement": "Run the same input through the actual photogrammetry pipeline. Retain actual processing success or failure; the full candidate journey remains in task 09.",
      "criteria": [
        "Exact software, model and asset licenses verified separately against primary sources.",
        "Runnable local six-photo processing with real status, cancellation, retained settings, outputs and reload; successful head geometry loads with independent shared assets.",
        "Observed, fitted and hidden inferred geometry distinguished; iterations, resource use, sizes, coverage, likeness/clipping limitations and failures retained. No fallback counted as candidate success.",
        "This processing milestone does not mark editing, expected selections, complete demos or professional acceptance complete."
      ],
      "status": "blocked",
      "changes": [
        "Verified current official releases: Meshroom 2025.1.0 and AliceVision 3.3.0. Both core projects are MPL-2.0, with separate third-party notices. Official Linux build configuration uses CUDA 12.1.1; separate NVIDIA agreement acceptance is pending.",
        "Prepared exact private source checkouts Meshroom 2025.1.0 at 024b6f398c67bec4968a29a2c5744e49e2bab9b8 and AliceVision 3.3.0 at 928bac2689461ffb6f0174609f983a16bdbd2b30. Pinned a separate Python 3.12.14 / PySide6 6.8.3 CLI environment; no native CUDA distribution acquired.",
        "Registered and serialized the real eleven-node photogrammetry graph. Configured classical SIFT and exhaustive pairing so no vocabulary tree or learned segmentation/matching model is needed. This is preparation only, not processing or geometry evidence."
      ],
      "limitations": [
        "AliceVision runtime download and execution are awaiting the user’s CUDA 12.1.1 agreement acceptance. Open-source CLI preparation proceeds independently.",
        "The required CUDA 12.1.1 acceptance answer has not arrived. Source/CLI preparation is verified, but the native archive has neither been downloaded nor executed. This route is blocked, not completed or demonstrated successfully."
      ],
      "verification": [
        {
          "command": "Official release and tagged build configuration inspection",
          "result": "Meshroom latest release links a 14.3 GB bundle on Zenodo; AliceVision offers a separate 1.505 GB Linux archive with published SHA-256 f43f498312859af627f2f7f65a6d33c2a3411b37989b8b680c04c8c690dcb640. Preparing pinned Meshroom source plus the smaller native distribution avoids unrelated optional AI assets."
        },
        {
          "command": "python scripts/native-demos/setup-meshroom.py",
          "result": "Passed: exact source hashes, pinned package installation, CLI help containing photogrammetry templates and kernel network namespace availability. The native acquisition flag refuses download without explicit CUDA agreement acceptance."
        },
        {
          "command": "Meshroom graph API inspection",
          "result": "Initial inspection used a nonexistent nodesDesc attribute and failed. Corrected to the current registered Graph API; scripts/native-demos/inspect-meshroom.py serialized eleven actual nodes and thirteen dependency edges without native execution."
        },
        {
          "command": "Private Meshroom Python provenance inspection",
          "result": "Retained primary PyPI package metadata, versioned wheel hashes and installed license/notices for thirteen dependencies. Qt/PySide uses its free LGPL option; native CUDA terms remain separate and pending."
        },
        {
          "command": "Native acquisition without acceptance negative check",
          "result": "Executed setup-meshroom.py --acquire-native without the acceptance flag. It exited before source/setup/download actions; the AliceVision native archive does not exist."
        },
        {
          "command": "Browser HTML log selector and SVG rendering",
          "result": "Task 09a shows blocked, exact license requirement and pending native processing. Inline graph loaded at 1100 by 1075 pixels; its retained SVG opened and rendered successfully. Clicking its linked image navigated to the SVG, so a subsequent image-selector query found no HTML image until returning to the log; this was navigation, not an asset-loading failure."
        },
        {
          "command": "Portable evidence link check",
          "result": "All 69 retained relative pictures and output links returned HTTP 200. The prepared graph and package provenance load locally."
        }
      ],
      "pictures": [
        {
          "src": "assets/meshroom-prepared-graph.svg",
          "caption": "2026-09-30: diagram derived from actual registered Meshroom and AliceVision node dependencies. Every stage remains unexecuted; this picture does not show a reconstructed head or processing success.",
          "date": "2026-09-30T03:00:08-03:00"
        },
        {
          "src": "assets/meshroom-prepared-graph-browser.png",
          "caption": "2026-09-30: actual in-app browser rendering of the prepared graph. Native runtime agreement is pending; there are no processing results or geometry.",
          "date": "2026-09-30T03:03:29-03:00"
        }
      ],
      "commits": [
        "2d8dfce1e83385bb0a01cd527f0d4a90fc5ca851"
      ],
      "outputs": [
        {
          "href": "assets/meshroom-setup-provenance.json",
          "label": "Pinned project source and pending native runtime provenance"
        },
        {
          "href": "assets/meshroom-python-provenance.json",
          "label": "Separate private CLI package licenses and wheel metadata"
        },
        {
          "href": "assets/meshroom-prepared-graph.json",
          "label": "Actual unexecuted configured native graph"
        }
      ],
      "events": [
        {
          "date": "2026-09-30T00:28:45-03:00",
          "text": "Separated native processing from full-demo verification to remove the dependency cycle through common editing and expected-selection history. Original full journey requirements remain in task 09."
        },
        {
          "date": "2026-09-30T02:43:02-03:00",
          "text": "Begin official Meshroom/AliceVision setup and exact license review. Use the same authorized six-view captures, retaining native failures without fallback."
        },
        {
          "date": "2026-09-30T03:00:08-03:00",
          "text": "Native acquisition remains gated by the pending CUDA agreement answer. No agreement inferred from FLAME acceptance or from installed NVIDIA graphics drivers."
        },
        {
          "date": "2026-09-30T03:01:40-03:00",
          "text": "Record concrete legal-runtime blocker and continue with the next independent candidate after committing the preparation milestone. All six-photo processing, persistence, styles, geometry and full journey checks remain pending for this candidate."
        }
      ]
    },
    {
      "id": "10a",
      "title": "Standalone MakeHuman processing experiment",
      "depends": [
        "06",
        "07b"
      ],
      "requirement": "Fit and export an actual MakeHuman template without Blender. Retain actual processing success or failure; the full candidate journey remains in task 10.",
      "criteria": [
        "Exact software, model and asset licenses verified separately against primary sources.",
        "Runnable local six-photo processing with real status, cancellation, retained settings, outputs and reload; successful head geometry loads with independent shared assets.",
        "Observed, fitted and hidden inferred geometry distinguished; iterations, resource use, sizes, coverage, likeness/clipping limitations and failures retained. No fallback counted as candidate success.",
        "This processing milestone does not mark editing, expected selections, complete demos or professional acceptance complete."
      ],
      "status": "verified",
      "changes": [
        "Standalone MakeHuman source is pinned and unmodified. Native Human.applyAllTargets applies eight explicit neutral macros and up to 24 signed head target files; native MHCLO proxy.getCoords refits 10 shared CC0 hairstyles and textured eyes. Shared coil/beard definitions generate real geometry on the fitted head. A local CPU rasterizer and embedded-texture GLB exporter run without Qt, OpenGL or Blender.",
        "The app queues real MakeHuman fitting through the same offline process group, all-six input snapshot, artifact authorization, cancellation and erasure safeguards. Candidate-specific controls and retained diagnostics are available in English and Portuguese. Three fictional cases have native fitted explorations, without automatically replacing the currently chosen workspace or selecting expected results.",
        "Added direct native deformation checks before head publication. The fitter now computes changing crown height for every target trial. Version 2 passed all three cases; version 1 failures remain retained and have no exported head."
      ],
      "limitations": [
        "Native 10a fitting is only the route prerequisite. Written/direct refinement, expected-result selection history and the full demo journey remain tasks 16, 17 and 10. Professional likeness, hair clipping and beard styling assessment remain pending.",
        "All head geometry is fitted or inferred. Facial landmarks cover three views for Alex/Maya and two for Noah; back/profile hidden surfaces retain the prior. The neck is clipped and capped at a declared artificial plane.",
        "The native hair proxy topology is unsmoothed and the procedural beard boundaries remain coarse. These are retained limitations for professional review and catalog improvement, not successful evidence of an actual haircut.",
        "Three validated native runs took 14.418 to 14.752 seconds and retained 72.7 to 74.2 MiB privately. These synthetic fixtures and 2D landmark residuals do not establish real-client reconstruction accuracy. Initial browser FPS measurements are short loading diagnostics, not sustained benchmark results.",
        "Earlier MakeHuman unversioned and version-1 explorations remain historical experiments. Version-1 Maya/Noah processing failed honestly before export; evaluate the version-2 options. Current technical fixture views do not constitute selection of the final route."
      ],
      "verification": [
        {
          "command": "MakeHuman core loader and Human initialization probe",
          "result": "Passed on private Python 3.12.14 / NumPy 2.5.3; missing compiled base.npz warning correctly falls back to the actual OBJ parser."
        },
        {
          "command": "Initial go test ./... and npm --prefix web run build",
          "result": "Passed. Build retained the existing 500 kB demo chunk warning. A later settings-gate test and final checks remain to run."
        },
        {
          "command": "Actual native output verification on three fictional clients",
          "result": "Passed 51 decoded GLBs, 18 native rendered views, finite positions/UVs, unit normals, valid indices, embedded textures, shared six-photo SHA-256 equality and absence of Blender processing. Native prediction differs from actual Human.applyAllTargets by at most 10 micrometres; actual maximum errors are retained in the linked JSON. Deliberate 20 mm corruption failed before head publication."
        },
        {
          "command": "python scripts/native-demos/verify-local.py --candidate makehuman --job-id e979cacf-a165-47b9-91f0-a4b53881ab0d",
          "result": "Passed authenticated 17 native assets, anonymous/private artifact denial, saved option and workspace reload, affirmative permission, actual no-face failure without fallback, erasure of nonfront input during native processing, process-group termination, dependent purge and permission withdrawal. Disposable fictional fixture was deleted."
        },
        {
          "command": "IAB actual validated MakeHuman option",
          "result": "All 11 hair and 5 beard native GLBs loaded with actual job URLs. Six named viewing angles synchronized both canvases. Saved coils plus clean-shaven exploration reopens after reload. Browser-started native repeat def93450-3a9a-418b-af04-ba6f29ba9541 completed in 15.292 seconds with byte-identical head GLB; previously chosen saved model remains e979cacf-a165-47b9-91f0-a4b53881ab0d."
        },
        {
          "command": "Population rerun with makehuman-metre-z-up-v2",
          "result": "Reused all three validated job IDs and options; no duplicate processing or automatic expected-result selection."
        },
        {
          "command": "mise exec go@1.26.0 -- go test ./...; go test -race ./...; npm --prefix web run build",
          "result": "Passed. Race run cmd/api 1.031 seconds and internal/app 4.394 seconds. Frontend build 1.63 seconds, existing 670.79 kB demo chunk warning remains."
        },
        {
          "command": "Portable HTML and assets audit",
          "result": "Passed 96 linked files or intentional localhost app links; every linked raster image decoded. IAB task selector displayed verified MakeHuman entry and all six entry images loaded after scrolling. Initial system Python audit lacked Pillow; reran successfully using the pinned native virtual environment. An evidence-picture click opened its image page as designed; returned to the log and checked remaining links without navigation."
        }
      ],
      "pictures": [
        {
          "src": "assets/makehuman-intermediate-neck.png",
          "caption": "2026-09-30 intermediate native MakeHuman CPU render: actual head and textured eyes; whole-face filtering left a jagged neck boundary, requiring a proper plane clip before delivery.",
          "date": "2026-09-30T03:31:14-03:00"
        },
        {
          "src": "assets/makehuman-validated-comparison.png",
          "caption": "2026-09-30 Validated version-2 standalone MakeHuman head and independent assets in the actual app. Coils and clean-shaven proposed; coarse stubble boundaries visible on the current reference. Synthetic inputs, inferred hidden geometry and pending styling review.",
          "date": "2026-09-30T04:34:00-03:00"
        },
        {
          "src": "assets/makehuman-validated-native-check.png",
          "caption": "2026-09-30 Actual retained native target-application check, landmark coverage and resource evidence. This verifies basis application, not professional likeness.",
          "date": "2026-09-30T04:34:00-03:00"
        },
        {
          "src": "assets/makehuman-six-fitted-renders.png",
          "caption": "2026-09-30 Six actual CPU renders of the retained fitted MakeHuman template. Native plane-clipped neck is artificial. Synthetic inputs; hidden surfaces inferred.",
          "date": "2026-09-30T04:34:00-03:00"
        },
        {
          "src": "assets/makehuman-retained-failure.png",
          "caption": "2026-09-30 Actual retained intermediate Maya version-1 failure. The native check rejected the crown framing mismatch before export, and no fallback head was supplied.",
          "date": "2026-09-30T04:34:00-03:00"
        },
        {
          "src": "assets/makehuman-save-conflict.png",
          "caption": "2026-09-30 Intermediate stale-workspace HTTP 409 during browser saving. Saved immutable option survived; reload and reopening subsequently passed.",
          "date": "2026-09-30T04:34:00-03:00"
        }
      ],
      "commits": [],
      "outputs": [
        {
          "href": "assets/makehuman-provenance.json",
          "label": "Pinned standalone MakeHuman software, core asset and dependency terms"
        },
        {
          "href": "assets/makehuman-intermediate-basis-failures.json",
          "label": "Retained actual intermediate target-validation failures and successful rejection before head export"
        },
        {
          "href": "assets/makehuman-output-verification.json",
          "label": "Actual native output, deformation and deliberate-corruption verification"
        },
        {
          "href": "assets/makehuman-live-verification.json",
          "label": "Permission, persistence, failure, cancellation and erasure checks"
        },
        {
          "href": "assets/makehuman-populated-validated-results.json",
          "label": "Validated native runs on the three shared fictional cases"
        },
        {
          "href": "assets/makehuman-validated-browser-styles.json",
          "label": "Actual browser loading and measured 16 independent native style assets"
        },
        {
          "href": "assets/makehuman-validated-browser-cameras.json",
          "label": "Six synchronized actual browser viewing angles"
        },
        {
          "href": "assets/makehuman-validated-repeat.json",
          "label": "Browser-queued version-2 repeat and actual head checksum"
        },
        {
          "href": "assets/makehuman-populated-native-results.json",
          "label": "Historical first processing runs, before direct basis validation"
        },
        {
          "href": "assets/makehuman-browser-repeat-check.json",
          "label": "Historical initial browser-queued native repeat"
        },
        {
          "href": "assets/makehuman-browser-style-checks.json",
          "label": "Historical initial native style loading checks"
        },
        {
          "href": "assets/makehuman-browser-camera-checks.json",
          "label": "Historical initial camera and zoom checks"
        }
      ],
      "events": [
        {
          "date": "2026-09-30T00:28:45-03:00",
          "text": "Separated native processing from full-demo verification to remove the dependency cycle through common editing and expected-selection history. Original full journey requirements remain in task 10."
        },
        {
          "date": "2026-09-30T03:04:13-03:00",
          "text": "Begin standalone MakeHuman fitting investigation while Meshroom awaits required runtime-license acceptance. Use actual MakeHuman source and core assets; do not count Blender processing as standalone MakeHuman."
        },
        {
          "date": "2026-09-30T03:22:42-03:00",
          "text": "Official MakeHuman v1.3.0 source pinned at 1f508f6083b2f823dab15de924b3bde72e08d77c. Its actual headless files3d loader and Human object instantiate a 19,158-vertex mesh using existing CC0 assets. First applyAllTargets call failed because the upstream progress callback expects a GUI application; adding a headless progress adapter is under evaluation. No Blender process or private fictional morph ground truth was used."
        },
        {
          "date": "2026-09-30T03:31:14-03:00",
          "text": "Native target application required only a headless progress callback, not a GUI replacement. Actual Human.applyAllTargets and proxy.getCoords passed with eight neutral macro targets and real hair/eye meshes. Initial CPU render showed a jagged neck extraction boundary; this intermediate defect is being corrected before verification. Setup initially looked for license files inside makehuman/; upstream keeps the two full licenses at the repository root, so the lookup was corrected and setup passed."
        },
        {
          "date": "2026-09-30T03:40:53-03:00",
          "text": "Three genuine MakeHuman runs completed in 11.20 to 11.45 seconds, with 40 to 60 paired landmarks and 72.6 to 74.1 MiB of retained private files. Rerunning population reused the same jobs/options. First population attempt ran before the rebuilt API was listening and failed with ConnectionRefusedError; after readiness it passed. /healthz served the SPA, so the actual /health endpoint was then checked and returned status ok."
        },
        {
          "date": "2026-09-30T06:51:45.261508+00:00",
          "text": "Pause before verification: comparison of native MakeHuman units exposed an MPFB basis error. Original MPFB target offsets are decimetres with Y up; its earlier fitting basis omitted conversion to metres with Z up. Repair and direct native target-application verification are active in task 07b. Actual MakeHuman fitting uses the correct conversion; its final verification and commit remain pending."
        },
        {
          "date": "2026-09-30T04:12:06-03:00",
          "text": "Resume standalone MakeHuman final verification after the committed MPFB coordinate repair. Add the same direct native target-application check to the standalone route and retain versioned outputs before its milestone commit."
        },
        {
          "date": "2026-09-30T04:17:57-03:00",
          "text": "Adding direct native deformation checks exposed a 3.2168 mm global framing mismatch for Maya and 2.2518 mm for Noah. The actual highest crown vertex changes after head morphing; a fixed neutral crown correspondence did not reproduce actual recentering. Both version-1 experiments failed before head export and remain retained. Version 2 now evaluates the highest native vertex from the full target height basis at every optimizer trial, with a separate checkpoint and new runs."
        },
        {
          "date": "2026-09-30T04:34:00-03:00",
          "text": "Intermediate save encountered expected HTTP 409 after CLI verification had changed the workspace version. The immutable explored option was retained; browser reload and reopening passed. Initial direct verifier accidentally wrote its result to the earlier MPFB filename; that historical MPFB evidence was restored from its committed version and the shared script now uses candidate-specific output names."
        }
      ]
    },
    {
      "id": "11a",
      "title": "FLAME 2023 Open processing experiment",
      "depends": [
        "06"
      ],
      "requirement": "Fit exact commercially usable Open model with compatible fitting code and assets. Retain actual processing success or failure; the full candidate journey remains in task 11.",
      "criteria": [
        "Exact software, model and asset licenses verified separately against primary sources.",
        "Runnable local six-photo processing with real status, cancellation, retained settings, outputs and reload; successful head geometry loads with independent shared assets.",
        "Observed, fitted and hidden inferred geometry distinguished; iterations, resource use, sizes, coverage, likeness/clipping limitations and failures retained. No fallback counted as candidate success.",
        "This processing milestone does not mark editing, expected selections, complete demos or professional acceptance complete."
      ],
      "status": "pending",
      "changes": [],
      "limitations": [],
      "verification": [],
      "pictures": [],
      "commits": [],
      "outputs": [],
      "events": [
        {
          "date": "2026-09-30T00:28:45-03:00",
          "text": "Separated native processing from full-demo verification to remove the dependency cycle through common editing and expected-selection history. Original full journey requirements remain in task 11."
        }
      ]
    },
    {
      "id": "12a",
      "title": "Open3D component processing experiment",
      "depends": [
        "07a",
        "08a"
      ],
      "requirement": "Process and evaluate meshes using Open3D with named reconstruction/fitting dependency. Retain actual processing success or failure; the full candidate journey remains in task 12.",
      "criteria": [
        "Exact software, model and asset licenses verified separately against primary sources.",
        "Runnable local six-photo processing with real status, cancellation, retained settings, outputs and reload; successful head geometry loads with independent shared assets.",
        "Observed, fitted and hidden inferred geometry distinguished; iterations, resource use, sizes, coverage, likeness/clipping limitations and failures retained. No fallback counted as candidate success.",
        "This processing milestone does not mark editing, expected selections, complete demos or professional acceptance complete."
      ],
      "status": "pending",
      "changes": [],
      "limitations": [],
      "verification": [],
      "pictures": [],
      "commits": [],
      "outputs": [],
      "events": [
        {
          "date": "2026-09-30T00:28:45-03:00",
          "text": "Separated native processing from full-demo verification to remove the dependency cycle through common editing and expected-selection history. Original full journey requirements remain in task 12."
        }
      ]
    },
    {
      "id": "13a",
      "title": "MeshLab / PyMeshLab component processing experiment",
      "depends": [
        "07a",
        "08a"
      ],
      "requirement": "Clean, repair, simplify and export shared meshes with named upstream route. Retain actual processing success or failure; the full candidate journey remains in task 13.",
      "criteria": [
        "Exact software, model and asset licenses verified separately against primary sources.",
        "Runnable local six-photo processing with real status, cancellation, retained settings, outputs and reload; successful head geometry loads with independent shared assets.",
        "Observed, fitted and hidden inferred geometry distinguished; iterations, resource use, sizes, coverage, likeness/clipping limitations and failures retained. No fallback counted as candidate success.",
        "This processing milestone does not mark editing, expected selections, complete demos or professional acceptance complete."
      ],
      "status": "pending",
      "changes": [],
      "limitations": [],
      "verification": [],
      "pictures": [],
      "commits": [],
      "outputs": [],
      "events": [
        {
          "date": "2026-09-30T00:28:45-03:00",
          "text": "Separated native processing from full-demo verification to remove the dependency cycle through common editing and expected-selection history. Original full journey requirements remain in task 13."
        }
      ]
    },
    {
      "id": "14a",
      "title": "CloudCompare component processing experiment",
      "depends": [
        "07a",
        "08a"
      ],
      "requirement": "Align and compare shared outputs with named upstream reconstruction/fitting route. Retain actual processing success or failure; the full candidate journey remains in task 14.",
      "criteria": [
        "Exact software, model and asset licenses verified separately against primary sources.",
        "Runnable local six-photo processing with real status, cancellation, retained settings, outputs and reload; successful head geometry loads with independent shared assets.",
        "Observed, fitted and hidden inferred geometry distinguished; iterations, resource use, sizes, coverage, likeness/clipping limitations and failures retained. No fallback counted as candidate success.",
        "This processing milestone does not mark editing, expected selections, complete demos or professional acceptance complete."
      ],
      "status": "pending",
      "changes": [],
      "limitations": [],
      "verification": [],
      "pictures": [],
      "commits": [],
      "outputs": [],
      "events": [
        {
          "date": "2026-09-30T00:28:45-03:00",
          "text": "Separated native processing from full-demo verification to remove the dependency cycle through common editing and expected-selection history. Original full journey requirements remain in task 14."
        }
      ]
    },
    {
      "id": "16",
      "title": "Client-specific refinements and direct editing",
      "depends": [
        "06",
        "07a",
        "08a",
        "09a",
        "10a",
        "11a",
        "12a",
        "13a",
        "14a"
      ],
      "requirement": "Provide meaningful written refinements and direct 3D changes within evaluated routes.",
      "criteria": [
        "Text refinements cause defined geometry/material changes with unsupported requests explained.",
        "Direct edits preserved in new revisions; synchronized client comparison and style independence retained.",
        "Missing coverage, likeness and clipping visible and checked; unmet quality requirements not marked complete."
      ],
      "status": "pending",
      "changes": [],
      "limitations": [
        "Not implemented or verified."
      ],
      "verification": [],
      "pictures": [],
      "commits": [],
      "outputs": [],
      "events": []
    },
    {
      "id": "17",
      "title": "Explored options, expected selections and history",
      "depends": [
        "16"
      ],
      "requirement": "Persist all alternatives, revisions and chosen expected results in the journey.",
      "criteria": [
        "Every explored option retained; selected state and rationale visible.",
        "Changing selection preserves earlier selections and revisions; reload/reopen verified.",
        "Expected, reference and actual material visibly distinguishable; failure cannot become successful preview."
      ],
      "status": "pending",
      "changes": [],
      "limitations": [
        "Not implemented or verified."
      ],
      "verification": [],
      "pictures": [],
      "commits": [],
      "outputs": [],
      "events": []
    },
    {
      "id": "07",
      "title": "Blender + MPFB complete demo verification",
      "depends": [
        "06",
        "07a",
        "16",
        "17"
      ],
      "requirement": "Fit shared photos using actual MPFB, explicit cameras, landmarks and bounded render iterations.",
      "criteria": [
        "Exact software and bundled model/asset licenses verified separately.",
        "Reproducible fit, matched renders, independent styles, editing, option selection and reopening.",
        "Fit versus observation and hidden inference labeled; iterations, resource use, output size, likeness/clipping failures recorded."
      ],
      "status": "pending",
      "changes": [],
      "limitations": [
        "Not implemented or verified."
      ],
      "verification": [],
      "pictures": [],
      "commits": [],
      "outputs": [],
      "events": [
        {
          "date": "2026-09-30T00:28:45-03:00",
          "text": "Full candidate journey verification follows actual native processing and shared editing/selection history. No approved feature removed."
        }
      ]
    },
    {
      "id": "08",
      "title": "COLMAP / PyCOLMAP complete demo verification",
      "depends": [
        "06",
        "08a",
        "16",
        "17"
      ],
      "requirement": "Reconstruct the agreed six photos through real COLMAP processing.",
      "criteria": [
        "Actual extraction, matching and reconstruction retained, including sparse capture failures.",
        "Successful outputs support shared styles, edits, selections and reopen; unmet requirements explicitly labeled.",
        "No denser capture substituted; versions, licenses, settings, timing, coverage and resources recorded."
      ],
      "status": "pending",
      "changes": [],
      "limitations": [
        "Not implemented or verified."
      ],
      "verification": [],
      "pictures": [],
      "commits": [],
      "outputs": [],
      "events": [
        {
          "date": "2026-09-30T00:28:45-03:00",
          "text": "Full candidate journey verification follows actual native processing and shared editing/selection history. No approved feature removed."
        }
      ]
    },
    {
      "id": "09",
      "title": "Meshroom / AliceVision complete demo verification",
      "depends": [
        "06",
        "09a",
        "16",
        "17"
      ],
      "requirement": "Run the same input through the actual photogrammetry pipeline.",
      "criteria": [
        "Runnable workflow and real retained outputs or explicit processing failures.",
        "Full viewer/options journey where viable; hardware/setup/resource/coverage limitations recorded.",
        "Licenses and exact versions verified; same six inputs, no hidden fallback."
      ],
      "status": "pending",
      "changes": [],
      "limitations": [
        "Not implemented or verified."
      ],
      "verification": [],
      "pictures": [],
      "commits": [],
      "outputs": [],
      "events": [
        {
          "date": "2026-09-30T00:28:45-03:00",
          "text": "Full candidate journey verification follows actual native processing and shared editing/selection history. No approved feature removed."
        }
      ]
    },
    {
      "id": "10",
      "title": "Standalone MakeHuman complete demo verification",
      "depends": [
        "06",
        "10a",
        "16",
        "17"
      ],
      "requirement": "Fit and export an actual MakeHuman template without Blender.",
      "criteria": [
        "Template adjustment, photo alignment, export and independent style application runnable.",
        "Refine/edit, save options, choose expected and reopen; likeness professional review pending.",
        "Code and models cleared separately; fitted/inferred geometry, iteration and resource metrics retained."
      ],
      "status": "pending",
      "changes": [],
      "limitations": [
        "Not implemented or verified."
      ],
      "verification": [],
      "pictures": [],
      "commits": [],
      "outputs": [],
      "events": [
        {
          "date": "2026-09-30T00:28:45-03:00",
          "text": "Full candidate journey verification follows actual native processing and shared editing/selection history. No approved feature removed."
        }
      ]
    },
    {
      "id": "11",
      "title": "FLAME 2023 Open complete demo verification",
      "depends": [
        "06",
        "11a",
        "16",
        "17"
      ],
      "requirement": "Fit exact commercially usable Open model with compatible fitting code and assets.",
      "criteria": [
        "Exact model access and user license acceptance handled before acquisition; no older noncommercial substitution.",
        "Actual multi-view fitting, texturing, independent styles and complete saved proposal journey.",
        "Code, weights, texture and landmark terms verified separately; failures and inference recorded."
      ],
      "status": "pending",
      "changes": [
        "Exact commercial Open model acquired privately; download account and agreement blocker resolved by user."
      ],
      "limitations": [
        "Not implemented or verified."
      ],
      "verification": [
        {
          "command": "FLAME2023Open.zip integrity and bundled readme",
          "result": "Archive passed integrity; bundled readme identifies CC-BY-4.0 and links exact model terms. Model loading and multi-view fitting remain pending."
        }
      ],
      "pictures": [],
      "commits": [],
      "outputs": [
        {
          "href": "assets/flame-open-provenance.json",
          "label": "Pinned model files, hashes and exact terms"
        }
      ],
      "events": [
        {
          "date": "2026-09-29T23:02:05-03:00",
          "text": "FLAME download prerequisite ready. Candidate task remains pending while shared assets task is active."
        },
        {
          "date": "2026-09-30T00:28:45-03:00",
          "text": "Full candidate journey verification follows actual native processing and shared editing/selection history. No approved feature removed."
        }
      ]
    },
    {
      "id": "12",
      "title": "Open3D component complete demo verification",
      "depends": [
        "06",
        "12a",
        "16",
        "17"
      ],
      "requirement": "Process and evaluate meshes using Open3D with named reconstruction/fitting dependency.",
      "criteria": [
        "Actual alignment, processing and comparisons with reproducible settings and retained meshes.",
        "Integrated complete viewer/options journey; supporting dependency explicit.",
        "Licenses, metrics and measured/inferred distinctions retained."
      ],
      "status": "pending",
      "changes": [],
      "limitations": [
        "Not implemented or verified."
      ],
      "verification": [],
      "pictures": [],
      "commits": [],
      "outputs": [],
      "events": [
        {
          "date": "2026-09-30T00:28:45-03:00",
          "text": "Full candidate journey verification follows actual native processing and shared editing/selection history. No approved feature removed."
        }
      ]
    },
    {
      "id": "13",
      "title": "MeshLab / PyMeshLab component complete demo verification",
      "depends": [
        "06",
        "13a",
        "16",
        "17"
      ],
      "requirement": "Clean, repair, simplify and export shared meshes with named upstream route.",
      "criteria": [
        "Repeatable actual filter pipeline and fidelity/clipping/output-size comparisons.",
        "Integrated saved comparison journey; not labeled standalone photo reconstruction.",
        "Software/assets licenses and complete setup/processing effort recorded."
      ],
      "status": "pending",
      "changes": [],
      "limitations": [
        "Not implemented or verified."
      ],
      "verification": [],
      "pictures": [],
      "commits": [],
      "outputs": [],
      "events": [
        {
          "date": "2026-09-30T00:28:45-03:00",
          "text": "Full candidate journey verification follows actual native processing and shared editing/selection history. No approved feature removed."
        }
      ]
    },
    {
      "id": "14",
      "title": "CloudCompare component complete demo verification",
      "depends": [
        "06",
        "14a",
        "16",
        "17"
      ],
      "requirement": "Align and compare shared outputs with named upstream reconstruction/fitting route.",
      "criteria": [
        "Actual repeatable registration and distances with retained diagnostic outputs.",
        "Integrated workflow through expected selection/reopen; shared upstream dependency explicit.",
        "Agreement between inferred meshes never presented as ground truth; licenses/resources recorded."
      ],
      "status": "pending",
      "changes": [],
      "limitations": [
        "Not implemented or verified."
      ],
      "verification": [],
      "pictures": [],
      "commits": [],
      "outputs": [],
      "events": [
        {
          "date": "2026-09-30T00:28:45-03:00",
          "text": "Full candidate journey verification follows actual native processing and shared editing/selection history. No approved feature removed."
        }
      ]
    },
    {
      "id": "15",
      "title": "Ample independent catalogs and added references",
      "depends": [
        "05",
        "07",
        "08",
        "09",
        "10",
        "11",
        "12",
        "13",
        "14"
      ],
      "requirement": "Expand toward roughly 40 hairstyles and 20 beardstyles, with professional-added references.",
      "criteria": [
        "Varied real reusable styles across length/texture/volume/silhouette/maintenance, independent catalogs and filters.",
        "Consistent renders and visible structured license provenance; professional import works privately.",
        "Assets load, render, combine, save/reopen across viable routes; incompatibilities recorded; professional review pending."
      ],
      "status": "pending",
      "changes": [],
      "limitations": [
        "Not implemented or verified."
      ],
      "verification": [],
      "pictures": [],
      "commits": [],
      "outputs": [],
      "events": []
    },
    {
      "id": "18",
      "title": "Actual outcomes and follow-up comparisons",
      "depends": [
        "04",
        "17"
      ],
      "requirement": "Post-cut uploads, follow-up visits and baseline/expected/actual comparisons.",
      "criteria": [
        "New visits append rather than overwrite photos or chosen results.",
        "Matching views compare all three states with honest missing angle handling.",
        "Service notes, client feedback and synthetic/simulated outcome labels persisted."
      ],
      "status": "pending",
      "changes": [],
      "limitations": [
        "Not implemented or verified."
      ],
      "verification": [],
      "pictures": [],
      "commits": [],
      "outputs": [],
      "events": []
    },
    {
      "id": "19",
      "title": "Client self-upload and reminders",
      "depends": [
        "01",
        "04",
        "18"
      ],
      "requirement": "Scoped client intake/upload and local reminders without requiring a client account.",
      "criteria": [
        "Expiring/revocable client link permits only authorized intake/upload; no studio record disclosure.",
        "Local due reminders and follow-up state survive restart; withdrawal revokes links/reminders.",
        "Failures and misuse boundaries verified; no external messaging unless later authorized."
      ],
      "status": "pending",
      "changes": [],
      "limitations": [
        "Not implemented or verified."
      ],
      "verification": [],
      "pictures": [],
      "commits": [],
      "outputs": [],
      "events": []
    },
    {
      "id": "20",
      "title": "Maintenance guidance and growth stages",
      "depends": [
        "03",
        "17",
        "18"
      ],
      "requirement": "Rich guidance and staged growth plans retained with the expected look.",
      "criteria": [
        "Styling steps, product categories, intervals and achievable stages editable and persisted.",
        "Future stages distinguished from immediate result; stage revisions preserve history.",
        "Fictional completed demo plans and follow-up evidence populated."
      ],
      "status": "pending",
      "changes": [],
      "limitations": [
        "Not implemented or verified."
      ],
      "verification": [],
      "pictures": [],
      "commits": [],
      "outputs": [],
      "events": []
    },
    {
      "id": "21",
      "title": "Review-ready integrated handoff",
      "depends": [
        "15",
        "17",
        "18",
        "19",
        "20"
      ],
      "requirement": "Verify every local workflow and compare all candidates without choosing a winner.",
      "criteria": [
        "Complete local app and all candidate experiments available, with license and performance comparison.",
        "End-to-end reload, auth, deletion, asynchronous failure and regression checks pass.",
        "Log and relative images load; commits and retained outputs linked.",
        "Professional likeness/asset assessment and final route choice explicitly pending."
      ],
      "status": "pending",
      "changes": [],
      "limitations": [
        "The local backup/restore flow is explicitly deferred by the user and excluded from this delivery. All remaining product/demo work and professional assessment are still pending."
      ],
      "verification": [],
      "pictures": [],
      "commits": [],
      "outputs": [],
      "events": []
    }
  ]
};
