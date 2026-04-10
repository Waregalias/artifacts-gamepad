'use client'

import {useEffect} from "react";
import {useRouter} from "next/navigation";

function SettingsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/controller');
  }, [router]);

  return null;
}

export default SettingsPage;
