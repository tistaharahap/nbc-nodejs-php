<?php

ini_set('memory_limit','512M');

require_once 'NaiveBayesClassifier.php';

$nbc = NULL;

$json = array(
	'diagnostics' => array(
		'mode' => '',
		'timeSpent' => 0
	)
);

if(!empty($argv) && count($argv) > 1) {
	$params = array(
		'n:' => 'namespace:',
		'm:' => 'mode:',
		'd:' => 'data:',
		'c::' => 'count::'
	);
	$args = getopt(implode('', array_keys($params)), $params);
	
	$nbc = new NaiveBayesClassifier(array(
		'store' => array(
			'mode'	=> 'redis',
			'db'	=> array(
				'db_host'	=> '127.0.0.1',
				'db_port'	=> '6379',
				'namespace'	=> $args['namespace']
			)
		),
		'debug' => FALSE
	));
	
	switch($args['mode']) {
		case 'train':
			train($args['data'], $nbc);
			break;
		case 'classify':
			classify($args['data'], $args['count'], $nbc);
			break;
		default:
			error("Not a valid method");
	}
}
else {
	error('No arguments passed');
}

function _output_json($msg, $code, $data) {
	$json['diagnostics']['error'] = array(
		'message' => $msg,
		'code' => $code
	);
	$json['data'] = $data;
	echo json_encode($json);
}

function train($data, $nbc) {
	$data = rawurldecode($data);
	$data = json_decode($data);
	
	$count = 0;
	if($data != NULL) {
		foreach($data as $d) {
			$nbc->train($d->words, $d->set);
			$count++;
		}
		
		_output_json('Training data successfully integrated', 200, array(
			'trainCount' => $count
		));
	}
	else {
		error("Failed parsing training data", 500);
	}
}

function classify($data, $count, $nbc) {
	$count = !empty($count) ? $count : 20;
	$data = rawurldecode($data);
	
	if($data != NULL) {
		_output_json('Classifier success', 200, $nbc->classify($data, $count));
	}
	else {
		error("Failed parsing classifier data", 500);
	}
}

function error($msg, $code = 403) {
	$json['diagnostics']['error'] = array(
		'message' => $msg,
		'code' => $code
	);
	echo json_encode($json);
}