<?php
function isMobileDevice() {
    $userAgent = $_SERVER['HTTP_USER_AGENT'];
    $mobileKeywords = [
        'Android', 'webOS', 'iPhone', 'iPad', 'iPod', 'BlackBerry', 
        'IEMobile', 'Opera Mini', 'Mobile'
    ];
    
    foreach ($mobileKeywords as $keyword) {
        if (stripos($userAgent, $keyword) !== false) {
            return true;
        }
    }
    return false;
}

if (isMobileDevice()) {
    header('Location: mobile/');
} else {
    header('Location: desktop/');
}
exit;
?>
