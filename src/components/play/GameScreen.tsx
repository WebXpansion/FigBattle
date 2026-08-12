"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/lib/routing";
import { createClient } from "@supabase/supabase-js";
import { HeroShader } from "@/components/hero/HeroShader";
import { SubmissionSuccess } from "@/components/play/SubmissionSuccess";
import { HelpModal } from "@/components/play/HelpModal";
import { GlbViewerOverlay } from "@/components/play/GlbViewerOverlay";

import {
  MAX_UPLOAD_BYTES,
  ALLOWED_IMAGE_MIME,
  isAllowedExt,
} from "@/lib/upload-rules";

const MESHY_BADGE_SVG = `<svg viewBox="0 0 167 64" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block"><path fill-rule="evenodd" clip-rule="evenodd" d="M14.2971 22.4248C14.9466 20.906 15.7367 19.4514 16.6571 18.0798L16.6721 18.0558C16.7741 17.9008 16.8781 17.7478 16.9821 17.5968C23.1421 8.04277 36.3661 2.31677 47.5481 7.38877C56.3851 11.1718 60.6201 18.8958 60.4981 25.7718C60.4371 29.2018 59.2781 32.5468 56.8851 34.9648C56.4751 35.3788 56.0361 35.7578 55.5701 36.1008C57.7301 37.8158 59.1421 39.9008 59.5091 42.3368C60.0581 45.9838 58.0911 49.2418 55.3221 51.6468C49.7821 56.4568 39.3991 59.4708 27.5721 58.2138C25.6081 58.0358 18.5101 56.6398 16.8941 54.0458C16.0643 53.6547 15.288 53.159 14.5841 52.5708C13.4791 51.6288 12.5661 50.3728 12.2301 48.7878C11.7401 46.4828 13.0061 42.5648 15.6351 41.4448C16.5801 46.0878 19.9521 46.3698 22.4551 46.6308C23.4801 45.7708 23.9741 45.2828 25.0051 43.9908C23.0031 44.1528 20.4611 43.6068 18.5101 42.5648C14.9301 40.6548 12.7751 37.1448 12.5401 32.1298C12.3071 28.8458 13.0131 25.4368 14.2971 22.4248ZM19.3261 19.1498C19.2163 19.3086 19.1083 19.4686 19.0021 19.6298C18.177 20.8585 17.4689 22.1619 16.8871 23.5228L16.8941 23.5838C15.7301 26.3698 15.1861 29.2128 15.3361 31.7678L15.3511 31.9938V31.9998L15.3611 32.1858C15.7731 39.2528 20.5961 41.5158 26.5241 41.4448C27.4841 41.4328 28.4731 41.3608 29.4771 41.2368C29.2181 42.3498 28.9281 43.3138 28.5611 44.1528C28.0341 45.3558 27.3481 46.3048 26.3671 47.0728C29.9011 47.3388 33.7271 46.8178 37.1501 45.7698C41.8801 45.4238 49.2211 42.7118 47.7301 37.4838C47.7055 37.3965 47.6798 37.3098 47.6511 37.2238C47.4911 36.6308 47.2991 36.0538 47.1031 35.5078L47.0881 35.4668L47.1051 35.4838C48.1583 35.5935 49.2215 35.5582 50.2651 35.3788C50.5863 35.3204 50.9044 35.246 51.2181 35.1558C51.746 35.0035 52.2583 34.8016 52.7481 34.5528L52.7631 34.5448L52.7771 34.5378L53.0031 34.4178C60.5801 30.2198 59.3651 15.4798 46.4101 9.95477C36.7521 5.55477 24.8971 10.4718 19.3261 19.1498ZM50.6461 36.3698C56.4081 43.0418 50.7231 49.1008 41.7451 52.4308C45.0831 50.2748 47.8241 46.8968 49.4751 42.0008C39.4851 51.4508 16.5661 52.4288 15.4981 46.0878C15.4776 45.858 15.4672 45.6274 15.4671 45.3968V45.3918C13.1681 49.9098 18.2591 52.7068 25.2311 53.1118L25.3211 53.1168C26.2319 53.1658 27.1444 53.1758 28.0561 53.1468L28.0931 53.1448C29.227 53.1071 30.3584 53.0137 31.4831 52.8648C35.5961 52.3208 39.8011 51.0198 43.2251 48.8558C41.3021 50.5278 39.4221 51.7468 37.5071 52.6408C34.4931 54.0468 31.3931 54.6478 27.9011 54.9408H27.8921C27.0891 55.0088 26.2651 55.0608 25.4161 55.1008C26.2251 55.2408 27.0361 55.3478 27.8491 55.4208C29.1321 55.5578 30.3911 55.6408 31.6241 55.6758C33.9471 55.7408 36.1741 55.6308 38.2751 55.3758C53.1631 53.5658 61.7421 44.4378 53.7051 38.2058C53.4204 37.9853 53.1272 37.7762 52.8261 37.5788C52.1288 37.1258 51.4015 36.7209 50.6491 36.3668L50.6411 36.3628L50.6461 36.3698Z" fill="#C5F955"/><path d="M19.0231 19.5992C12.3801 29.6632 14.1481 42.9762 28.4611 40.6172L42.6511 35.9462C55.9411 31.5232 56.5761 17.9712 48.1911 11.9972C41.8381 7.47019 27.1141 7.34019 19.0221 19.6002L19.0231 19.5992Z" fill="#FF3E8F"/><path fill-rule="evenodd" clip-rule="evenodd" d="M26.438 27.5199C32.741 25.8139 39.414 18.5659 40.44 9.27488C38.257 9.07288 35.83 9.22088 33.175 9.80688C25.182 11.5699 19.5 17.3889 16.885 23.5229C17.416 28.2759 24.783 27.9679 26.438 27.5189V27.5199Z" fill="#C5F955"/><path fill-rule="evenodd" clip-rule="evenodd" d="M26.4391 27.519C32.7421 25.814 38.6421 18.833 39.6681 9.54199L37.8581 9.97499C34.9381 20.473 26.7081 27.841 19.3191 25.789C20.4111 27.812 25.5861 27.75 26.4391 27.519Z" fill="#67B800"/><path fill-rule="evenodd" clip-rule="evenodd" d="M37.9259 11.483C29.5859 9.81302 19.7539 15.079 17.4209 24.163C20.8109 17.658 30.1649 11.793 37.9259 11.483Z" fill="#E9FFCE"/><path d="M54.737 19.8299L41.957 37.3939L28.934 40.1439C28.795 40.2439 28.67 40.2009 28.667 40.1999L28.934 40.1439C29.146 39.9899 29.39 39.5019 29.29 38.0209C29.02 37.2549 28.838 35.4469 27.001 34.2169C26.119 33.6269 25.284 32.8409 25.431 31.7899C25.575 30.7529 26.511 30.1379 27.529 29.8929C36.329 27.7779 40.397 18.7669 41.301 10.2529L49.009 13.5899L54.737 19.8299Z" fill="#C91C65"/><path d="M46.71 31.016C41.386 28.726 43.999 18.733 50.155 16.376C50.1573 16.3793 50.1597 16.3826 50.162 16.386C46.408 19.433 45.752 26.036 48.722 29.189C48.303 29.642 47.842 30.089 47.337 30.529C47.137 30.691 46.927 30.853 46.71 31.016Z" fill="#4C8700"/><path fill-rule="evenodd" clip-rule="evenodd" d="M16.145 34.8382C20.617 34.2092 27.905 36.0882 28.146 40.1362C23.14 40.4262 17.741 37.8242 16.144 34.8382H16.145Z" fill="#67B800"/><path d="M16.857 35.87C17.52 36.33 18.498 36.753 19.898 37.054C21.956 37.496 24.252 37.212 25.873 36.792C23.306 35.105 19.108 34.422 16.144 34.838C16.332 35.188 16.572 35.534 16.857 35.87Z" fill="#C5F955"/><path d="M31.1721 37.3202C31.9131 29.2022 43.3751 27.9902 45.2361 33.1142C45.3881 33.5742 45.5791 34.0742 45.7801 34.6032C46.3301 36.0472 46.9601 37.7022 47.1061 39.3122C44.8841 43.3832 37.0861 46.7262 29.6321 47.1052C31.8951 42.3462 31.1721 37.3202 31.1721 37.3202Z" fill="white"/><path d="M44.6529 42.5079L37.1239 45.7709C42.1879 43.1189 42.4489 31.9299 37.0239 33.0469L41.5279 31.1289L45.7479 34.7919L44.6529 42.5079Z" fill="#FF97C2"/><path fill-rule="evenodd" clip-rule="evenodd" d="M46.4101 9.95603C44.8477 9.24394 43.1922 8.75709 41.4931 8.51003V8.50903L41.4761 8.50803C32.7241 7.24603 23.7941 11.88 19.0881 19.528C23.7531 13.264 32.2511 9.63803 39.2851 10.616C38.6901 14.159 36.4001 19.435 32.2511 23.169C28.1341 26.875 21.8931 28.273 18.0681 25.99C20.8881 29.342 29.4561 28.913 34.1121 24.89C38.4771 21.12 41.1821 15.225 41.6801 11.123C41.8841 11.173 42.0851 11.225 42.2841 11.281C44.4061 11.954 44.9961 13.781 45.1391 15.058C45.2341 15.902 44.7111 16.638 44.0891 17.22C42.7731 18.45 41.4611 20.433 40.6991 22.567C39.8401 24.975 38.6941 27.464 36.6091 28.949C35.6751 29.614 34.9351 30.185 34.3651 30.684C32.3771 31.994 30.8471 34.153 30.2531 37.236C30.1681 37.68 30.1191 37.94 30.0501 38.326C23.1301 39.702 16.7501 38.63 15.3501 31.994C15.7401 40.37 22.2181 42.129 29.4761 41.237C28.8461 43.945 28.0321 45.769 26.3661 47.072C27.6281 47.167 28.9261 47.162 30.2291 47.069C31.3621 45.665 31.7521 43.184 32.0851 41.064C32.1611 40.577 32.2351 40.109 32.3131 39.677C32.3717 39.3469 32.4421 39.0191 32.5241 38.694C34.6951 30.164 43.8031 31.669 44.2441 37.574C44.2541 37.71 44.2661 37.843 44.2771 37.972C44.4761 40.342 44.5771 41.545 37.1231 45.772C41.9291 45.429 49.4651 42.632 47.6501 37.225C47.4861 36.617 47.2891 36.025 47.0881 35.467L47.1051 35.484C60.5721 36.808 62.0811 16.639 46.4101 9.95603ZM50.1551 16.376C43.9991 18.733 41.3861 28.726 46.7111 31.016L48.7211 29.189C45.7531 26.036 46.4081 19.433 50.1611 16.385L50.1551 16.376Z" fill="#181818"/><path d="M27.8481 55.4208C50.4661 57.8348 65.9681 43.6488 50.6401 36.3628C56.4111 43.0378 50.7251 49.0998 41.7441 52.4308C45.0831 50.2748 47.8241 46.8968 49.4741 42.0008C39.1341 51.7838 14.9341 52.4868 15.4671 45.3908C11.2711 53.6348 31.6831 56.1488 43.2251 48.8558C37.5771 53.7658 32.3011 54.7698 25.4151 55.1008C26.2251 55.2408 27.0361 55.3478 27.8481 55.4208Z" fill="#181818"/><path fill-rule="evenodd" clip-rule="evenodd" d="M23.332 24.1178C22.444 24.0958 21.846 23.6468 21.997 23.1158C22.447 21.5348 22.784 19.1008 22.606 17.1558C22.558 16.6318 23.248 16.1318 24.147 16.0368C25.047 15.9428 25.814 16.2898 25.862 16.8128C26.055 18.9208 25.695 21.4988 25.212 23.1978C25.062 23.7278 24.22 24.1408 23.332 24.1178Z" fill="#181818"/><path d="M22.1709 23.7178C22.1709 23.7178 22.7029 24.0378 23.4649 23.6298C24.6969 22.9698 24.9849 18.9918 24.9849 16.6698C24.9849 16.0418 24.2119 16.0308 24.2119 16.0308C25.0829 15.9598 25.8159 16.3028 25.8619 16.8128C26.0549 18.9208 25.6949 21.4988 25.2119 23.1978C25.0619 23.7278 24.2199 24.1408 23.3319 24.1178C22.8179 24.1048 22.4019 23.9488 22.1719 23.7178H22.1709Z" fill="#FF3E8F"/><path fill-rule="evenodd" clip-rule="evenodd" d="M30.2851 20.9211C29.3971 20.8981 28.7991 20.4501 28.9501 19.9191C29.3991 18.3381 29.7371 15.9041 29.5581 13.9591C29.5111 13.4351 30.2011 12.9351 31.1001 12.8401C32.0001 12.7461 32.7671 13.0931 32.8151 13.6161C33.0081 15.7241 32.6471 18.3021 32.1651 20.0011C32.0151 20.5311 31.1721 20.9441 30.2851 20.9211Z" fill="#181818"/><path d="M29.124 20.5202C29.124 20.5202 29.656 20.8412 30.418 20.4332C31.65 19.7732 31.937 15.7952 31.937 13.4732C31.937 12.8452 31.165 12.8342 31.165 12.8342C32.035 12.7622 32.768 13.1062 32.815 13.6162C33.008 15.7242 32.647 18.3022 32.165 20.0012C32.015 20.5312 31.172 20.9442 30.285 20.9212C29.771 20.9082 29.355 20.7512 29.124 20.5202Z" fill="#FF3E8F"/><path d="M11.947 5.5L13.281 9.127L16.884 10.469L13.281 11.812L11.947 15.439L10.614 11.812L7.011 10.47L10.614 9.127L11.947 5.5ZM6.314 14.887L7.074 16.969L9.129 17.739L7.074 18.51L6.314 20.592L5.554 18.51L3.5 17.74L5.554 16.969L6.314 14.887Z" fill="#C5F955"/><path d="M74.24 53V11.84H81.912L85.216 33.176L85.496 35.36H85.608L85.888 33.176L89.192 11.84H96.864V53H91.264V25.392H90.928L90.704 27.128L87.12 53H83.984L80.4 27.128L80.176 25.392H79.84V53H74.24ZM107.525 53.448C105.266 53.448 103.484 52.673 102.177 51.124C100.889 49.556 100.245 47.643 100.245 45.384V29.984C100.245 27.594 100.889 25.654 102.177 24.16C103.465 22.667 105.266 21.92 107.581 21.92C109.093 21.92 110.39 22.265 111.473 22.956C112.566 23.638 113.441 24.6196 113.993 25.784C114.572 26.96 114.861 28.304 114.861 29.816V38.72H105.509V45.384C105.509 46.149 105.677 46.859 106.013 47.512C106.368 48.147 106.89 48.464 107.581 48.464C108.309 48.464 108.822 48.165 109.121 47.568C109.438 46.971 109.597 46.243 109.597 45.384V42.024H114.861V45.552C114.861 47.922 114.217 49.836 112.929 51.292C111.66 52.729 109.858 53.448 107.525 53.448ZM105.509 34.296H109.597V29.984C109.597 29.144 109.448 28.416 109.149 27.8C108.869 27.165 108.346 26.848 107.581 26.848C106.872 26.848 106.349 27.175 106.013 27.828C105.677 28.463 105.509 29.181 105.509 29.984V34.296ZM124.486 53.448C123.161 53.448 122.003 53.224 121.014 52.776C120.051 52.3487 119.206 51.6956 118.55 50.872C117.897 50.032 117.402 49.042 117.066 47.904C116.749 46.765 116.59 45.496 116.59 44.096H121.854C121.854 45.346 122.05 46.439 122.442 47.372C122.853 48.287 123.534 48.744 124.486 48.744C125.307 48.744 125.839 48.399 126.082 47.708C126.325 47.018 126.446 46.224 126.446 45.328C126.446 44.283 126.035 43.218 125.214 42.136C124.457 41.088 123.614 40.1046 122.694 39.196C121.182 37.703 119.922 36.228 118.914 34.772C117.925 33.316 117.43 31.608 117.43 29.648C117.43 27.333 118.037 25.467 119.25 24.048C120.463 22.629 122.19 21.92 124.43 21.92C125.774 21.92 126.903 22.097 127.818 22.452C128.751 22.807 129.498 23.339 130.058 24.048C130.618 24.758 131.019 25.625 131.262 26.652C131.523 27.679 131.654 28.864 131.654 30.208H126.39C126.39 29.238 126.287 28.398 126.082 27.688C125.877 26.978 125.363 26.624 124.542 26.624C123.87 26.624 123.394 26.914 123.114 27.492C122.834 28.052 122.694 28.771 122.694 29.648C122.694 30.675 122.937 31.589 123.422 32.392C123.926 33.176 124.757 34.137 125.914 35.276C127.357 36.6804 128.687 38.1972 129.89 39.812C131.103 41.417 131.71 43.162 131.71 45.048C131.71 46.28 131.542 47.409 131.206 48.436C130.889 49.463 130.413 50.349 129.778 51.096C129.165 51.8406 128.389 52.4345 127.51 52.832C126.633 53.242 125.625 53.448 124.486 53.448ZM133.939 53V11.84H139.595V24.468C140.08 23.964 140.799 23.413 141.751 22.816C142.703 22.219 143.608 21.92 144.467 21.92C145.4 21.92 146.184 22.19 146.819 22.732C147.454 23.273 147.93 24.002 148.247 24.916C148.564 25.812 148.723 26.811 148.723 27.912V53H143.067V29.088C143.067 28.528 142.936 28.08 142.675 27.744C142.432 27.389 142.143 27.212 141.807 27.212C141.415 27.212 140.948 27.436 140.407 27.884C139.866 28.314 139.595 28.799 139.595 29.34V53H133.939ZM152.64 63.976C152.398 63.976 152.108 63.966 151.772 63.948C151.443 63.9301 151.116 63.8927 150.792 63.836V58.824C150.848 58.843 150.998 58.861 151.24 58.88C151.483 58.917 151.642 58.936 151.716 58.936C152.762 58.936 153.602 58.656 154.236 58.096C154.89 57.536 155.347 56.789 155.608 55.856C155.702 55.576 155.748 55.249 155.748 54.876C155.767 54.503 155.776 54.176 155.776 53.896L150.568 22.368H156.112L158.352 41.464L158.464 43.592H158.688L158.8 41.464L161.04 22.368H166.584L161.152 55.296C160.947 56.939 160.48 58.413 159.752 59.72C159.043 61.045 158.091 62.081 156.896 62.828C155.702 63.593 154.283 63.976 152.64 63.976Z" fill="#181818"/></svg>`;

export type Round = {
  id: string;
  status: string;
  durationSec: number;
  remainingSec: number;
  startedAt: string;
  theme: {
    id: string;
    labelFr: string;
    labelEn: string;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    category: string;
    glbUrl: string | null;
    glbPreviewUrl: string | null;
  };
};

type Phase = "running" | "submitted" | "timeup";

const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_BUCKET ?? "submissions";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase non configuré");
  return createClient(url, key);
}

function format(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}
function computeRemaining(mountEpochMs: number, durationSec: number) {
  const elapsed = Math.floor((Date.now() - mountEpochMs) / 1000);
  return Math.max(0, durationSec - elapsed);
}

export function GameScreen({
  round,
  onPlayAgain,
}: {
  round: Round;
  onPlayAgain: () => void;
}) {
  const t = useTranslations("play");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("running");
  // Instant de montage figé une seule fois : c'est le vrai départ du chrono.
  const mountRef = useRef<number>(Date.now());
  const [remaining, setRemaining] = useState(() =>
    computeRemaining(mountRef.current, round.durationSec)
  );
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Popup "êtes-vous sûr de vouloir abandonner" + état d'envoi de l'abandon.
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [show3D, setShow3D] = useState(false);

  const [abandoning, setAbandoning] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const label = round.theme[locale === "fr" ? "labelFr" : "labelEn"];

  useEffect(() => {
    if (phase !== "running") return;
    tickRef.current = setInterval(() => {
      const r = computeRemaining(mountRef.current, round.durationSec);
      setRemaining(r);
      if (r <= 0) {
        if (tickRef.current) clearInterval(tickRef.current);
        setPhase("timeup");
      }
    }, 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [phase, round]);

  const onPickFile = (f: File | null) => {
    setError(null);
    if (!f) return;
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    if (!isAllowedExt(ext) || !(ALLOWED_IMAGE_MIME as readonly string[]).includes(f.type)) {
      setError(t("invalidType"));
      return;
    }
    if (f.size > MAX_UPLOAD_BYTES) {
      setError(t("tooLarge"));
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const submit = async () => {
    if (!file || phase !== "running") return;
    setBusy(true);
    setError(null);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
      const urlRes = await fetch(`/api/submissions?action=upload-url&ext=${ext}`);
      if (!urlRes.ok) throw new Error("upload-url");
      const { filePath, token } = await urlRes.json();

      const supabase = getSupabase();
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .uploadToSignedUrl(filePath, token, file);
      if (upErr) throw upErr;

      const createRes = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roundId: round.id, filePath }),
      });
      if (createRes.status === 409) {
        if (tickRef.current) clearInterval(tickRef.current);
        setPhase("timeup");
        return;
      }
      if (!createRes.ok) throw new Error("create");

      if (tickRef.current) clearInterval(tickRef.current);
      setPhase("submitted");
    } catch {
      setError(tCommon("error"));
    } finally {
      setBusy(false);
    }
  };

  // Abandon volontaire : PATCH le round en ABANDONED côté serveur, puis on
  // relance le flux normal (retour à l'écran d'intro → nouveau tirage possible).
// Abandon volontaire : PATCH le round en ABANDONED côté serveur, puis
  // redirige vers l'accueil (dans la bonne langue, et sur le bon domaine
  // une fois en prod — la locale est gérée automatiquement).
  const abandon = async () => {
    if (abandoning) return;
    setAbandoning(true);
    try {
      await fetch("/api/rounds", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "abandon" }),
      });
    } catch {
      // Même en cas d'erreur réseau, on rend la main au joueur.
    } finally {
      if (tickRef.current) clearInterval(tickRef.current);
      setShowAbandonConfirm(false);
      setAbandoning(false);
      router.push("/");
    }
  };

  if (phase === "submitted") {
    return (
      <div className="fixed inset-0 overflow-hidden">
        <HeroShader />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-ink/20" aria-hidden="true" />
        <SubmissionSuccess />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-24">
      <HeroShader />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-ink/20" aria-hidden="true" />

      {phase === "running" && (
        <div className="grid w-full max-w-6xl gap-4 lg:grid-cols-[1.2fr_1fr]">
          {/* Colonne gauche : dépôt d'image */}
          <label className="group relative flex min-h-[60vh] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-white/30 bg-white/10 p-8 text-center backdrop-blur-md transition hover:border-white/50">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
            />
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="absolute inset-0 h-full w-full object-contain p-4" />
            ) : (
              <>
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-3xl text-white/80">
                  +
                </span>
                <p className="mt-6 font-display text-xl font-bold text-white">
                  {t("uploadPrompt")}
                </p>
                <p className="mt-2 text-sm text-white/50">{t("uploadHint")}</p>
              </>
            )}
          </label>



          {/* Colonne droite : thème + chrono */}
          <div className="flex flex-col gap-4">
            {/* Bloc thème (badge Meshy en haut à droite si applicable) */}
            <div className="relative rounded-3xl border border-white/15 bg-white/10 p-8 backdrop-blur-md">
              {round.theme.glbUrl && (
                <div
                  className="absolute right-6 top-6 flex h-10 w-[140px] items-center justify-center rounded-full px-3.5 py-1.5"
                  style={{ background: "#C5F955" }}
                  dangerouslySetInnerHTML={{ __html: MESHY_BADGE_SVG }}
                />
              )}
              <h1 className="font-display text-2xl font-black uppercase leading-tight text-white">
                {label}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                {t("themeHint")}
              </p>
            </div>

            {/* Bloc chrono */}
            <div className="flex flex-1 flex-col items-center justify-center rounded-3xl border border-white/15 bg-white/10 p-8 backdrop-blur-md">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                {t("timeLeft")}
              </p>
              <p
                className={`mt-2 font-mono text-6xl font-bold tabular-nums ${
                  remaining <= 30 ? "text-magenta" : "text-white"
                }`}
              >
                {format(remaining)}
              </p>
            </div>

            {/* Bloc Meshy : le bouton "Voir le glb 3D", sous le chrono */}
            {round.theme.glbUrl && round.theme.glbPreviewUrl && (
              <button
                onClick={() => setShow3D(true)}
                style={{
                  height: "64px",
                  backgroundColor: "white",
                  color: "black",
                  borderRadius: "10px",
                  padding: "24px",
                  width: "100%",
                  textAlign: "center",
                }}
                className="font-display text-sm font-black uppercase transition hover:brightness-95"
              >
                {t("viewGlb")}
              </button>
            )}

            {/* Bouton submit : apparaît après dépôt */}
            {file && (
              <button
                onClick={submit}
                disabled={busy}
                className="w-full rounded-2xl bg-white px-6 py-4 font-display text-lg font-black uppercase text-ink transition enabled:hover:brightness-110 disabled:opacity-40"
              >
                {busy ? t("uploading") : t("submit")}
              </button>
            )}
            {error && <p className="text-center text-sm text-magenta">{error}</p>}
          </div>
        </div>
      )}


{phase === "timeup" && (
        <div className="rounded-3xl border border-white/10 bg-white/10 p-10 text-center backdrop-blur-md">
          <h2 className="font-display text-3xl font-black uppercase text-white">
            {t("timeUpTitle")}
          </h2>
          <p className="mt-3 text-white/70">{t("timeUpBody")}</p>
          <button
            onClick={onPlayAgain}
            className="mt-6 rounded-full bg-white px-6 py-3 font-display font-bold uppercase text-ink transition hover:brightness-110"
          >
            {t("playAgain")}
          </button>
        </div>
      )}

      {/* Bouton ABANDONNER : bas au centre, uniquement pendant la partie. */}
      {phase === "running" && (
        <button
          onClick={() => setShowAbandonConfirm(true)}
          className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2 rounded-2xl border border-white/40 bg-white/10 px-8 py-3 font-display text-sm font-black uppercase tracking-wider text-white backdrop-blur-md transition hover:border-white/70 hover:bg-white/20"
        >
          {t("abandon")}
        </button>
      )}

      {/* Boutons aide + son (décoratifs) */}
{/* Bouton aide (ouvre la modale) + bouton son (décoratif) */}
<button
        onClick={() => setShowHelp(true)}
        className="absolute bottom-6 left-6 z-20 flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-lg font-bold text-white backdrop-blur-md transition hover:bg-white/20"
        aria-label={t("helpButton")}
      >
        ?
      </button>
      <a
     href="https://discord.gg/EbyeDccR96"
     target="_blank"
     rel="noopener noreferrer"
     className="absolute bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-white/10 backdrop-blur-md transition hover:bg-white/20"
     aria-label="Discord"
   >
     <svg width="20" height="20" viewBox="0 -28.5 256 256" fill="currentColor" aria-hidden="true">
       <path d="M216.856339,16.5966031 C200.285002,8.84328665 182.566144,3.2084988 164.041564,0 C161.766523,4.11318106 159.108624,9.64549908 157.276099,14.0464379 C137.583995,11.0849896 118.072967,11.0849896 98.7430163,14.0464379 C96.9108417,9.64549908 94.1925838,4.11318106 91.8971895,0 C73.3526068,3.2084988 55.6133949,8.86399117 39.0420583,16.6376612 C5.61752293,67.146514 -3.4433191,116.400813 1.08711069,164.955721 C23.2560196,181.510915 44.7403634,191.567697 65.8621325,198.148576 C71.0772151,190.971126 75.7283628,183.341335 79.7352139,175.300261 C72.104019,172.400575 64.7949724,168.822202 57.8887866,164.667963 C59.7209612,163.310589 61.5131304,161.891452 63.2445898,160.431257 C105.36741,180.133187 151.134928,180.133187 192.754523,160.431257 C194.506336,161.891452 196.298154,163.310589 198.110326,164.667963 C191.183787,168.842556 183.854737,172.420929 176.223542,175.320965 C180.230393,183.341335 184.861538,190.991831 190.096624,198.16893 C211.238746,191.588051 232.743023,181.531619 254.911949,164.955721 C260.227747,108.668201 245.831087,59.8662432 216.856339,16.5966031 Z M85.4738752,135.09489 C72.8290281,135.09489 62.4592217,123.290155 62.4592217,108.914901 C62.4592217,94.5396472 72.607595,82.7145587 85.4738752,82.7145587 C98.3405064,82.7145587 108.709962,94.5189427 108.488529,108.914901 C108.508531,123.290155 98.3405064,135.09489 85.4738752,135.09489 Z M170.525237,135.09489 C157.88039,135.09489 147.510584,123.290155 147.510584,108.914901 C147.510584,94.5396472 157.658606,82.7145587 170.525237,82.7145587 C183.391518,82.7145587 193.761324,94.5189427 193.539891,108.914901 C193.539891,123.290155 183.391518,135.09489 170.525237,135.09489 Z" />
     </svg>
   </a>

      {/* Popup de confirmation d'abandon */}
      {/* Popup de confirmation d'abandon */}
      {showAbandonConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 px-4 backdrop-blur-sm"
          onClick={() => !abandoning && setShowAbandonConfirm(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-8 text-center text-ink shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-2xl font-black uppercase leading-tight text-ink">
              {t("abandonConfirmTitle")}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-ink/60">
              {t("abandonConfirmBody")}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row-reverse">
              <button
                onClick={abandon}
                disabled={abandoning}
                className="w-full rounded-2xl bg-ink px-6 py-3 font-display text-sm font-black uppercase text-white transition enabled:hover:brightness-125 disabled:opacity-40"
              >
                {t("abandonConfirm")}
              </button>
              <button
                onClick={() => setShowAbandonConfirm(false)}
                disabled={abandoning}
                className="w-full rounded-2xl border border-ink/15 bg-white px-6 py-3 font-display text-sm font-black uppercase text-ink transition enabled:hover:bg-ink/5 disabled:opacity-40"
              >
                {t("abandonCancel")}
              </button>
            </div>
          </div>
        </div>
      )}
   {show3D && round.theme.glbUrl && (
        <GlbViewerOverlay
          glbUrl={round.theme.glbUrl}
          onClose={() => setShow3D(false)}
        />
      )}
         {/* Modale d'aide */}
         <HelpModal open={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
}