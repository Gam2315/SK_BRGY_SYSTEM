"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  confirmEducationClaim,
  lookupEducationClaim,
  type EducationClaimApplicant,
} from "@/app/actions/education-assistance-claims";

export default function AdminEducationClaimScanner() {
  const [token, setToken] = useState("");
  const [application, setApplication] = useState<EducationClaimApplicant | null>(
    null,
  );
  const [message, setMessage] = useState("");
  const [messageStatus, setMessageStatus] = useState<"error" | "success">(
    "error",
  );
  const [isIdVerified, setIsIdVerified] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isConfirming, startConfirmTransition] = useTransition();
  const lastScannedToken = useRef("");
  const [cameraError, setCameraError] = useState("");

  const findApplication = useCallback(
    (value: string) => {
      const claimToken = value.trim();
      setToken(claimToken);
      setApplication(null);
      setIsIdVerified(false);
      setMessage("");
      setMessageStatus("error");

      startTransition(async () => {
        try {
          const result = await lookupEducationClaim(claimToken);
          setApplication(result.application ?? null);
          setMessage(result.error ?? "");
        } catch (error) {
          console.error("Could not look up education assistance claim:", error);
          setMessage("Could not look up this claim. Please try again.");
        }
      });
    },
    [startTransition],
  );

  const handleScan = useCallback(
    (decodedText: string) => {
      if (decodedText !== lastScannedToken.current) {
        lastScannedToken.current = decodedText;
        findApplication(decodedText);
      }
    },
    [findApplication],
  );

  useEffect(() => {
    let isMounted = true;
    let scanner: import("html5-qrcode").Html5QrcodeScanner | undefined;

    import("html5-qrcode")
      .then(({ Html5QrcodeScanner, Html5QrcodeScanType }) => {
        if (!isMounted) {
          return;
        }

        scanner = new Html5QrcodeScanner(
          "education-claim-qr-reader",
          {
            fps: 10,
            qrbox: { width: 240, height: 240 },
            supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
            rememberLastUsedCamera: true,
          },
          false,
        );
        scanner.render(handleScan, () => undefined);
      })
      .catch((error: unknown) => {
        console.error("Could not load QR scanner:", error);
        if (isMounted) {
          setCameraError(
            "The QR scanner could not be started. Use the token field below.",
          );
        }
      });

    return () => {
      isMounted = false;
      if (scanner) {
        void scanner.clear().catch((error: unknown) => {
          console.error("Could not stop QR scanner:", error);
        });
      }
    };
  }, [handleScan]);

  function handleConfirmClaim() {
    if (!isIdVerified || !token) {
      return;
    }

    setMessage("");
    setMessageStatus("error");
    startConfirmTransition(async () => {
      try {
        const result = await confirmEducationClaim(token);
        if (result.application) {
          setApplication(null);
          setIsIdVerified(false);
          setMessage(result.success ?? "Claim confirmed.");
          setMessageStatus("success");
        } else {
          setMessage(result.error ?? "Could not confirm this claim.");
          setApplication(null);
        }
      } catch (error) {
        console.error("Could not confirm education assistance claim:", error);
        setMessage("Could not confirm this claim. Please try again.");
      }
    });
  }

  return (
    <section className="education-claim-scanner">
      <div className="education-claim-scanner-intro">
        <span className="section-kicker">EDUCATIONAL ASSISTANCE</span>
        <h2>Verify a resident claim</h2>
        <p>
          Scan the applicant&apos;s QR code, compare their valid ID with the
          application details, then confirm the claim.
        </p>
      </div>

      <div className="education-claim-scanner-grid">
        <div className="education-claim-camera">
          <h3>Scan claim QR code</h3>
          <div
            aria-label="QR code scanner"
            className="education-claim-qr-reader"
            id="education-claim-qr-reader"
          />
          {cameraError && (
            <p className="education-claim-message error" role="alert">
              {cameraError}
            </p>
          )}
        </div>

        <div className="education-claim-verification">
          <h3>Applicant verification</h3>
          {isPending ? (
            <p className="education-claim-placeholder" role="status">
              Checking claim token…
            </p>
          ) : application ? (
            <>
              <dl className="education-claim-details">
                <div>
                  <dt>Applicant</dt>
                  <dd>{application.applicant_name}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{application.applicant_email}</dd>
                </div>
                <div>
                  <dt>Contact number</dt>
                  <dd>{application.contact_number || "Not provided"}</dd>
                </div>
                <div>
                  <dt>Zone</dt>
                  <dd>{application.zone || "Not provided"}</dd>
                </div>
                <div>
                  <dt>Education level</dt>
                  <dd>
                    {application.education_level === "high_school"
                      ? "High school"
                      : "College"}
                  </dd>
                </div>
                <div>
                  <dt>School</dt>
                  <dd>{application.school_name}</dd>
                </div>
                <div>
                  <dt>Year / grade</dt>
                  <dd>{application.year_or_grade_level}</dd>
                </div>
              </dl>
              <label className="education-claim-id-check">
                <input
                  checked={isIdVerified}
                  onChange={(event) => setIsIdVerified(event.target.checked)}
                  type="checkbox"
                />
                <span>I verified the claimant&apos;s valid ID in person.</span>
              </label>
              <button
                className="education-claim-confirm"
                disabled={!isIdVerified || isConfirming}
                onClick={handleConfirmClaim}
                type="button"
              >
                {isConfirming ? "Confirming…" : "Confirm claim"}
              </button>
            </>
          ) : (
            <p className="education-claim-placeholder">
              Scan a QR code or enter its claim token to view applicant details.
            </p>
          )}

          {message && (
            <p
              className={`education-claim-message ${messageStatus}`}
              role={messageStatus === "success" ? "status" : "alert"}
            >
              {message}
            </p>
          )}
        </div>
      </div>

      <form
        className="education-claim-token-form"
        onSubmit={(event) => {
          event.preventDefault();
          findApplication(token);
        }}
      >
        <label htmlFor="education-claim-token">Enter claim token manually</label>
        <div>
          <input
            autoComplete="off"
            id="education-claim-token"
            onChange={(event) => setToken(event.target.value)}
            placeholder="Paste or type the UUID from the QR code"
            value={token}
          />
          <button disabled={isPending || !token.trim()} type="submit">
            {isPending ? "Checking…" : "Verify token"}
          </button>
        </div>
      </form>
    </section>
  );
}
